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
        'INSERT INTO users (id, email, password, created_at, updated_at) VALUES ($1, $2, $3, now(), now())',
        [randomUUID(), email, 'already-hashed-password'],
    );
});

When(
    'I POST \\/auth\\/register with email {string} and password {string}',
    async (email: string, password: string) => {
        const response = await request(ctx().httpServer)
            .post('/auth/register')
            .send({ email, password });
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
            .send({ email, password, [property]: value });
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

Then('the error message says {string}', (fragment: string) => {
    const message = ctx().lastResponse?.body?.message ?? '';
    assert.ok(String(message).includes(fragment));
});
