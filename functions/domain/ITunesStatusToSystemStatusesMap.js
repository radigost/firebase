const SubscriptionStatus = require('./SubscriptionStatus');
const ITunesSubscriptionStatus = require('./ITunesSubscriptionStatus');

const ITunesStatusToSystemStatusesMap = {
    [ITunesSubscriptionStatus["Trial Started"]]: SubscriptionStatus.trial,
    [ITunesSubscriptionStatus["Trial Converted"]]: SubscriptionStatus.active,
    [ITunesSubscriptionStatus["Trial Canceled"]]: SubscriptionStatus.cancelled,
    [ITunesSubscriptionStatus["Trial Billing Retry"]]: SubscriptionStatus.billingRetry,
    [ITunesSubscriptionStatus["Trial Still Active"]]: SubscriptionStatus.trial,
    [ITunesSubscriptionStatus["Subscription Billing Retry"]]: SubscriptionStatus.billingRetry,
    [ITunesSubscriptionStatus["Subscription Canceled"]]: SubscriptionStatus.cancelled,
    [ITunesSubscriptionStatus["Subscription Refunded"]]: SubscriptionStatus.no,
    [ITunesSubscriptionStatus["Subscription Started"]]: SubscriptionStatus.active,
    [ITunesSubscriptionStatus["Subscription Renewed"]]: SubscriptionStatus.active,
    [ITunesSubscriptionStatus["Subscription Upgraded"]]: SubscriptionStatus.active,
}

module.exports = ITunesStatusToSystemStatusesMap
