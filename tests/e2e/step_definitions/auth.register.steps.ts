import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { ApiContext } from '../support/context';

function ctx(): ApiContext {
    return ApiContext.current();
}

Given('no user with email {string} exists', async (email: string) => {
    await ctx().dataSource.query('DELETE FROM users WHERE email = $1', [email]);
});

Given('a user with email {string} already exists', async (email: string) => {
    await ctx().dataSource.query(
        `INSERT INTO users
            (id, email, name, preferred_currency, roles, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())`,
        [randomUUID(), email, 'John Doe', 'EUR', JSON.stringify(['user'])],
    );
});

When(
    'I POST \\/auth\\/register with email {string} and password {string}',
    async (email: string, password: string) => {
        const response = await request(ctx().httpServer)
            .post('/auth/register')
            .send({
                email,
                password,
                name: 'John Doe',
                preferredCurrency: 'EUR',
            });
        ctx().lastResponse = response;
    },
);

When(
    'I POST \\/auth\\/register with email {string} and password {string} and unknown property {string} = {string}',
    async (
        email: string,
        password: string,
        property: string,
        value: string,
    ) => {
        const response = await request(ctx().httpServer)
            .post('/auth/register')
            .send({
                email,
                password,
                name: 'John Doe',
                preferredCurrency: 'EUR',
                [property]: value,
            });
        ctx().lastResponse = response;
    },
);

Then('the response status is {int}', (status: number) => {
    assert.strictEqual(ctx().lastResponse?.status, status);
});

Then('the user with email {string} is persisted', async (email: string) => {
    const rows = await ctx().dataSource.query(
        'SELECT id FROM users WHERE email = $1',
        [email],
    );
    assert.strictEqual(rows.length, 1);
});

Then(
    'the credentials for email {string} are persisted',
    async (email: string) => {
        const rows = await ctx().dataSource.query(
            `SELECT ac.id
               FROM auth_credentials ac
               JOIN users u ON u.id = ac.user_id
              WHERE u.email = $1`,
            [email],
        );
        assert.strictEqual(rows.length, 1);
    },
);

When(
    'I POST \\/auth\\/register with full profile {string}, {string}, {string}, {string}, {string} and address {string}, {string}, {string}, {string}',
    async (
        email: string,
        password: string,
        name: string,
        currency: string,
        avatar: string,
        street: string,
        city: string,
        postalCode: string,
        country: string,
    ) => {
        const response = await request(ctx().httpServer)
            .post('/auth/register')
            .send({
                email,
                password,
                name,
                preferredCurrency: currency,
                avatar,
                address: { street, city, postalCode, country },
            });
        ctx().lastResponse = response;
    },
);

Then(
    'the stored profile for {string} has avatar {string} and address {string}, {string}, {string}, {string}',
    async (
        email: string,
        avatar: string,
        street: string,
        city: string,
        postalCode: string,
        country: string,
    ) => {
        const rows = await ctx().dataSource.query(
            `SELECT avatar_url, address_street, address_city, address_postal_code, address_country
               FROM users WHERE email = $1`,
            [email],
        );
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].avatar_url, avatar);
        assert.strictEqual(rows[0].address_street, street);
        assert.strictEqual(rows[0].address_city, city);
        assert.strictEqual(rows[0].address_postal_code, postalCode);
        assert.strictEqual(rows[0].address_country, country);
    },
);

Then('the error message says {string}', (fragment: string) => {
    const message = ctx().lastResponse?.body?.message ?? '';
    assert.ok(String(message).includes(fragment));
});
