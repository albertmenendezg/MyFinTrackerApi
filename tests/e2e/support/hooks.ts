import {
    AfterAll,
    Before,
    BeforeAll,
    setDefaultTimeout,
} from '@cucumber/cucumber';
import { ApiContext } from './context';

setDefaultTimeout(60_000);

BeforeAll(async function () {
    await ApiContext.start();
});

Before(async function () {
    await ApiContext.current().dataSource.query('TRUNCATE TABLE users CASCADE');
});

AfterAll(async function () {
    await ApiContext.stop();
});
