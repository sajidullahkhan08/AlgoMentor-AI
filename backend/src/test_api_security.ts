/**
 * Automated verification for auth, rate limiting, and error sanitization.
 *
 * These tests exercise the middleware directly so they need no network access
 * and no Supabase credentials.
 */

import { authenticate } from './middleware/authenticate';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

function createResponse() {
  const res: any = { statusCode: 200, body: undefined, headers: {} as Record<string, string> };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: any) => {
    res.body = body;
    return res;
  };
  res.setHeader = (name: string, value: string) => {
    res.headers[name] = value;
  };
  return res;
}

async function main() {
  console.log('=== AlgoMentor AI — API Security Middleware Verification ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  // --- Authentication -------------------------------------------------
  let nextCalled = false;
  const noHeaderRes = createResponse();
  await authenticate({ headers: {} } as any, noHeaderRes, (() => {
    nextCalled = true;
  }) as any);
  assert(noHeaderRes.statusCode === 401 && !nextCalled, 'Requests without a bearer token are rejected');

  nextCalled = false;
  const wrongSchemeRes = createResponse();
  await authenticate({ headers: { authorization: 'Basic abc' } } as any, wrongSchemeRes, (() => {
    nextCalled = true;
  }) as any);
  assert(wrongSchemeRes.statusCode === 401 && !nextCalled, 'Non-bearer authorization schemes are rejected');

  // --- Rate limiting --------------------------------------------------
  const limiter = rateLimit({ name: `test-${process.pid}`, windowMs: 60_000, max: 2 });
  const rateReq = { userId: 'rate-test-user', ip: '203.0.113.10' } as any;
  let allowed = 0;
  const next = () => {
    allowed++;
  };

  const first = createResponse();
  limiter(rateReq, first, next);
  const second = createResponse();
  limiter(rateReq, second, next);
  assert(first.statusCode === 200 && second.statusCode === 200 && allowed === 2, 'Requests within budget are allowed');

  const third = createResponse();
  limiter(rateReq, third, next);
  assert(third.statusCode === 429, 'Requests over budget receive HTTP 429');
  assert(Boolean(third.headers['Retry-After']), 'Rate-limited responses include Retry-After');
  assert(third.headers['X-RateLimit-Remaining'] === '0', 'Rate-limit headers report the remaining budget');

  const otherUser = createResponse();
  limiter({ userId: 'rate-test-other', ip: '203.0.113.11' } as any, otherUser, next);
  assert(otherUser.statusCode === 200, 'Rate limits are isolated per user');

  // --- Error sanitization ---------------------------------------------
  const tooLarge = createResponse();
  const tooLargeError: any = new Error('request entity too large');
  tooLargeError.type = 'entity.too.large';
  errorHandler(tooLargeError, {} as any, tooLarge, (() => {}) as any);
  assert(tooLarge.statusCode === 413 && tooLarge.body.error === 'Request body is too large', 'Oversized bodies return 413');

  const malformed = createResponse();
  const malformedError: any = new SyntaxError('Unexpected token in JSON');
  malformedError.body = '{bad';
  errorHandler(malformedError, {} as any, malformed, (() => {}) as any);
  assert(malformed.statusCode === 400 && malformed.body.error === 'Malformed JSON body', 'Malformed JSON returns 400');

  const internal = createResponse();
  errorHandler(
    new Error('connection to database failed: secret details'),
    {} as any,
    internal,
    (() => {}) as any
  );
  assert(
    internal.statusCode === 500 &&
      internal.body.error === 'Internal server error' &&
      !JSON.stringify(internal.body).includes('secret'),
    'Unexpected errors return a generic 500 without leaking internals'
  );

  console.log(`\nVerification Complete: ${passed} / ${total} assertions passed.`);
  if (passed !== total) {
    console.error('⚠️ API security middleware tests failed.');
    process.exit(1);
  }
  console.log('🎉 All API security middleware tests passed.\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
