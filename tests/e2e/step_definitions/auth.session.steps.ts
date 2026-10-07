import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { ApiContext } from '../support/context';

const DEFAULT_PASSWORD = 'S3cur3Pass!';

function ctx(): ApiContext {
    return ApiContext.current();
}

function sentCookies(): string[] {
    const header = ctx().lastResponse?.headers['set-cookie'];
    if (!header) {
        return [];
    }
    return Array.isArray(header) ? header : [header];
}

function setCookieValue(name: string): string | undefined {
    for (const cookie of sentCookies()) {
        const match = new RegExp(`^${name}=([^;]*)`).exec(cookie);
        if (match) {
            return match[1];
        }
    }
    return undefined;
}

async function send(
    method: 'get' | 'post',
    path: string,
    body?: Record<string, string>,
): Promise<void> {
    const context = ctx();
    const client =
        context.useAgent && !context.forcedCookie
            ? context.agent
            : request(context.httpServer);

    let call = client[method](path);
    if (context.forcedCookie) {
        call = call.set('Cookie', context.forcedCookie);
    }
    if (body !== undefined) {
        call = call.send(body);
    }

    context.lastResponse = await call;
    context.forcedCookie = undefined;
}

Given(
    'a registered user {string} with password {string}',
    async (email: string, password: string) => {
        const response = await request(ctx().httpServer)
            .post('/auth/register')
            .send({
                email,
                password,
                name: 'John Doe',
                preferredCurrency: 'EUR',
            });
        assert.strictEqual(response.status, 201);
    },
);

Given('I am logged in as {string}', async (email: string) => {
    await send('post', '/auth/login', {
        email,
        password: DEFAULT_PASSWORD,
    });
    assert.strictEqual(ctx().lastResponse?.status, 204);
});

Given('I keep the current refresh cookie', () => {
    const value = setCookieValue('refresh_token');
    assert.ok(value, 'the login response set no refresh cookie');
    ctx().keptRefreshCookie = value;
});

Given('I send the kept refresh cookie', () => {
    const value = ctx().keptRefreshCookie;
    assert.ok(value, 'no refresh cookie was kept');
    ctx().forcedCookie = `refresh_token=${value}`;
});

Given('I have no cookies', () => {
    ctx().useAgent = false;
});

Given('I hold an invalid access cookie', () => {
    ctx().forcedCookie = 'access_token=not-a-jwt';
});

Given('I hold a forged refresh cookie', () => {
    ctx().forcedCookie = 'refresh_token=forged.token.value';
});

When(
    'I POST \\/auth\\/login with email {string} and password {string}',
    async (email: string, password: string) => {
        await send('post', '/auth/login', { email, password });
    },
);

When('I POST \\/auth\\/refresh', async () => {
    await send('post', '/auth/refresh');
});

When('I POST \\/auth\\/logout', async () => {
    await send('post', '/auth/logout');
});

When('I GET \\/auth\\/me', async () => {
    await send('get', '/auth/me');
});

Then('the response body is empty', () => {
    const body = ctx().lastResponse?.body;
    assert.ok(
        !body || Object.keys(body).length === 0,
        `body was ${ctx().lastResponse?.text}`,
    );
});

Then('the response sets the {string} cookie', (name: string) => {
    assert.ok(setCookieValue(name), `the response set no ${name} cookie`);
});

Then('the response sets no cookie', () => {
    assert.strictEqual(sentCookies().length, 0);
});

Then('the response clears the {string} cookie', (name: string) => {
    const cookies = sentCookies();
    const cleared = cookies.find(
        (cookie) =>
            cookie.startsWith(`${name}=`) &&
            /(expires=Thu, 01 Jan 1970|max-age=0)/i.test(cookie),
    );
    assert.ok(
        cleared,
        `the response did not clear ${name}: ${cookies.join(', ')}`,
    );
});

Then(
    'the response body field {string} is {string}',
    (field: string, value: string) => {
        const body = ctx().lastResponse?.body ?? {};
        assert.strictEqual(body[field], value);
    },
);

async function countRefreshTokens(
    email: string,
    revoked: boolean,
): Promise<number> {
    const rows = await ctx().dataSource.query(
        `SELECT count(*)::int AS total
           FROM refresh_tokens rt
           JOIN users u ON u.id = rt.user_id
          WHERE u.email = $1
            AND (rt.revoked_at IS NOT NULL) = $2`,
        [email, revoked],
    );
    return rows[0].total as number;
}

Then('a refresh token is stored for {string}', async (email: string) => {
    assert.strictEqual(await countRefreshTokens(email, false), 1);
});

Then(
    'an active refresh token is stored for {string}',
    async (email: string) => {
        assert.ok((await countRefreshTokens(email, false)) >= 1);
    },
);

Then('no refresh token is stored for {string}', async (email: string) => {
    assert.strictEqual(
        (await countRefreshTokens(email, false)) +
            (await countRefreshTokens(email, true)),
        0,
    );
});

Then('no raw refresh token is stored', async () => {
    const raw = setCookieValue('refresh_token');
    assert.ok(raw, 'the response set no refresh cookie');

    const rows = await ctx().dataSource.query(
        'SELECT token_hash FROM refresh_tokens',
    );

    for (const row of rows as { token_hash: string }[]) {
        assert.match(row.token_hash, /^[0-9a-f]{64}$/);
        assert.notStrictEqual(row.token_hash, raw);
    }
});

Then('the kept refresh token is revoked', async () => {
    const raw = ctx().keptRefreshCookie;
    assert.ok(raw, 'no refresh cookie was kept');

    const rows = await ctx().dataSource.query(
        'SELECT revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [createHash('sha256').update(raw).digest('hex')],
    );

    assert.strictEqual(rows.length, 1, 'the kept refresh token was not stored');
    assert.ok(rows[0].revoked_at, 'the kept refresh token was not revoked');
});
