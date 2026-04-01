/**
 * @jest-environment node
 */

const mockGetUser = jest.fn();
const mockCreateCheckout = jest.fn();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: (...a: unknown[]) => mockCreateCheckout(...a) } },
  },
  subscriptionPlans: {
    starter: { stripePriceId: 'price_s', name: 'Starter' },
    pro: { stripePriceId: 'price_p', name: 'Pro' },
    team: { stripePriceId: 'price_t', name: 'Team' },
  },
}));

describe('/api/billing/checkout', () => {
  let POST: Function;

  beforeAll(async () => {
    const mod = await import('@/app/api/billing/checkout/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null });
    mockCreateCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/s' });
  });

  function makeReq(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('creates checkout session for valid plan', async () => {
    const res = await POST(makeReq({ plan: 'pro' }));
    const json = await res.json();
    expect(json.url).toBe('https://checkout.stripe.com/s');
  });

  it('returns 400 for invalid plan', async () => {
    const res = await POST(makeReq({ plan: 'fake' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no' } });
    const res = await POST(makeReq({ plan: 'pro' }));
    expect(res.status).toBe(401);
  });
});
