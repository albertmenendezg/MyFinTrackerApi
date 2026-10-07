import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { ApiContext } from '../support/context';

function ctx(): ApiContext {
    return ApiContext.current();
}

async function send(
    method: 'get' | 'patch',
    path: string,
    body?: Record<string, unknown>,
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

async function waitFor(
    condition: () => Promise<boolean>,
    message: string,
    timeoutMs = 15000,
): Promise<void> {
    const started = Date.now();
    for (;;) {
        if (await condition()) {
            return;
        }
        if (Date.now() - started > timeoutMs) {
            assert.fail(message);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}

Given('an admin user {string} exists', async (email: string) => {
    const response = await request(ctx().httpServer)
        .post('/auth/register')
        .send({
            email,
            password: 'S3cur3Pass!',
            name: 'Root Admin',
            preferredCurrency: 'EUR',
        });
    assert.strictEqual(response.status, 201);

    await ctx().dataSource.query(
        'UPDATE users SET roles = $1 WHERE email = $2',
        [JSON.stringify(['admin']), email],
    );
    await ctx().dataSource.query(
        `UPDATE auth_credentials SET roles = $1
          WHERE user_id = (SELECT id FROM users WHERE email = $2)`,
        [JSON.stringify(['admin']), email],
    );
});

When('I GET \\/users\\/me', async () => {
    await send('get', '/users/me');
});

When(
    'I PATCH \\/users\\/me with name {string} and currency {string}',
    async (name: string, currency: string) => {
        await send('patch', '/users/me', {
            name,
            preferredCurrency: currency,
        });
    },
);

When('I PATCH \\/users\\/me with avatar {string}', async (avatar: string) => {
    await send('patch', '/users/me', { avatar });
});

When('I PATCH \\/users\\/me clearing the avatar', async () => {
    await send('patch', '/users/me', { avatar: null });
});

When(
    'I PATCH \\/users\\/me with address {string}, {string}, {string}, {string}',
    async (
        street: string,
        city: string,
        postalCode: string,
        country: string,
    ) => {
        await send('patch', '/users/me', {
            address: { street, city, postalCode, country },
        });
    },
);

When(
    'I PATCH \\/users\\/me with currency {string}',
    async (currency: string) => {
        await send('patch', '/users/me', { preferredCurrency: currency });
    },
);

When(
    'I PATCH \\/users\\/me with unknown property {string} = {string}',
    async (property: string, value: string) => {
        await send('patch', '/users/me', { [property]: value });
    },
);

When(
    'I PATCH the roles of {string} with {string}',
    async (email: string, roles: string) => {
        const rows = await ctx().dataSource.query(
            'SELECT id FROM users WHERE email = $1',
            [email],
        );
        const userId = rows.length === 1 ? rows[0].id : randomUUID();
        await send('patch', `/users/${userId}/roles`, {
            roles: roles.split(',').map((role) => role.trim()),
        });
    },
);

Then(
    'the response address field {string} is {string}',
    (field: string, value: string) => {
        const body = ctx().lastResponse?.body ?? {};
        assert.strictEqual(body.address?.[field], value);
    },
);

Then('the response body field {string} is null', (field: string) => {
    const body = ctx().lastResponse?.body ?? {};
    assert.strictEqual(body[field], null);
});

Then(
    'the user {string} has roles {string}',
    async (email: string, roles: string) => {
        const expected = roles
            .split(',')
            .map((role) => role.trim())
            .sort();
        const rows = await ctx().dataSource.query(
            'SELECT roles FROM users WHERE email = $1',
            [email],
        );
        assert.strictEqual(rows.length, 1);
        assert.deepStrictEqual([...rows[0].roles].sort(), expected);
    },
);

Then(
    'the credential projection for {string} has roles {string}',
    async (email: string, roles: string) => {
        const expected = roles
            .split(',')
            .map((role) => role.trim())
            .sort();
        await waitFor(async () => {
            const rows = await ctx().dataSource.query(
                `SELECT ac.roles AS roles
                   FROM auth_credentials ac
                   JOIN users u ON u.id = ac.user_id
                  WHERE u.email = $1`,
                [email],
            );
            return (
                rows.length === 1 &&
                JSON.stringify([...rows[0].roles].sort()) ===
                    JSON.stringify(expected)
            );
        }, `the credential projection for ${email} did not converge to ${expected}`);
    },
);
