/**
 * @jest-environment node
 */

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
const mockConstructEvent = jest.fn();

jest.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => ({
    from: jest.fn().mockReturnValue({
      upsert: mockUpsert,
      update: mockUpdate,
    }),
  }),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: (...a: unknown[]) => mockConstructEvent(...a) },
  },
}));

describe('/api/webhooks/stripe', () => {
  let POST: Function;

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const mod = await import('@/app/api/webhooks/stripe/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeReq(body = 'body', sig = 'sig_test') {
    const headers: Record<string, string> = {};
    if (sig) headers['stripe-signature'] = sig;
    return new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers,
      body,
    });
  }

  it('handles subscription.created event', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.created',
      data: {
        object: {
          customer: 'cus_1', id: 'sub_1',
          items: { data: [{ price: { id: 'price_s' } }] },
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      },
    });
    const res = await POST(makeReq());
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it('handles subscription.deleted event', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
  });

  it('handles invoice.payment_failed event', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_1' } },
    });
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
  });

  it('returns 400 for missing signature', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: 'body',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid signature', async () => {
    mockConstructEvent.mockImplementationOnce(() => { throw new Error('bad sig'); });
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });
});
