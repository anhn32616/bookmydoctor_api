const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://e97a364facb14aeeb7e3a2683fefc82d@o4504282455801856.ingest.sentry.io/4504282548142080' });
module.exports = Sentry;