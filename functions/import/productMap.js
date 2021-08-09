// FYI: I'm gonna use integers as a primary way to show trial and subscription duration,
// but it's meant to be enums, e.g. 7 = week, 31 = month, 183 = half a year, 366 = year and so on,
// because it could be 28, 29, 30 or 31 day in a month and 365 or 366 days in a year
// FYI2: We have not only subscriptions in our app, but also 'forever' purchases, I
// will use '-1' as a subscriptionLength as a workaround, but read it as Int.max
// Non-Consumable Purchases
const nonConsumable =
    {
        "app.momeditation.mo.subscription.forever":
            {
                "trialLength": 0,
                "subscriptionLength": -1
            }
        ,
        "app.momeditation.mo.subscription.verv.forever":
            {
                "trialLength": 0,
                "subscriptionLength": -1
            }
    }
// Auto-Renewable Subscriptions
const autoRenewable =
    {
        "app.momeditation.mo.subscription.month": {"trialLength": 7, "subscriptionLength": 31},
        "app.momeditation.mo.subscription.year": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.month.withoutTrial": {"trialLength": 0, "subscriptionLength": 31},
        "app.momeditation.mo.subscription.year.withoutTrial": {"trialLength": 0, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.yearOnly": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.999.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.999.withTrial.withDiscount.30": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.year.1490.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.1490.withTrial.withDiscount.30": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.year.1990.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.1990.withTrial.withDiscount.30": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.year.2490.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.2490.withTrial.withDiscount.30": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription_v2.halfYear.999.monthPaidTrial.99.withDiscount.50": {
            "trialLength": 31,
            "subscriptionLength": 183
        },
        "app.momeditation.mo.subscription_v2.halfYear.999.monthPaidTrial.99": {
            "trialLength": 31,
            "subscriptionLength": 183
        },
        "app.momeditation.mo.subscription_v2.halfYear.999.withoutTrial": {"trialLength": 0, "subscriptionLength": 183},
        "app.momeditation.mo.subscription_v2.month.299.monthPaidTrial.99.withDiscount.50": {
            "trialLength": 31,
            "subscriptionLength": 31
        },
        "app.momeditation.mo.subscription_v2.month.299.monthPaidTrial.99": {
            "trialLength": 31,
            "subscriptionLength": 31
        },
        "app.momeditation.mo.subscription.month.299.withoutTrial": {"trialLength": 0, "subscriptionLength": 31},
        "app.momeditation.mo.subscription_v2.year.1490.monthPaidTrial.99.withDiscount.50": {
            "trialLength": 31,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription_v2.year.1490.monthPaidTrial.99": {
            "trialLength": 31,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.year.1490.withoutTrial": {"trialLength": 0, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.alternativeDiscount.year.599.withoutTrial": {
            "trialLength": 0,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.cheaperOldGoodNoTrial.year.599.withoutTrial": {
            "trialLength": 0,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.cheaperOldGoodTrial.year.599.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.meditopia.month.349.withTrial": {"trialLength": 3, "subscriptionLength": 31},
        "app.momeditation.mo.subscription.newGood.year.999.withTrial": {"trialLength": 3, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.oldAngry.halfYear.999.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 183
        },
        "app.momeditation.mo.subscription.oldGoodPromo.year.999.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.oldGoodSecret.year.999.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.oldGoodWithMonth.month.349.withTrial": {
            "trialLength": 3,
            "subscriptionLength": 31
        },
        "app.momeditation.mo.subscription.oldGoodWithMonth.year.999.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.oldGood.year.999.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.sharedDiscount.year.599.withoutTrial": {
            "trialLength": 0,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.verv2Promo.year.2790.withTrial": {
            "trialLength": 7,
            "subscriptionLength": 366
        },
        "app.momeditation.mo.subscription.verv2.month.849.withoutTrial": {"trialLength": 0, "subscriptionLength": 31},
        "app.momeditation.mo.subscription.verv2.year.2790.withTrial": {"trialLength": 7, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.verv14.year.2790.withTrial": {"trialLength": 14, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.verv30.year.2790.withTrial": {"trialLength": 31, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.verv.halfYear.2790.withTrial": {"trialLength": 7, "subscriptionLength": 183},
        "app.momeditation.mo.subscription.verv.month.849.withoutTrial": {"trialLength": 0, "subscriptionLength": 31},
        "app.momeditation.mo.subscription.year.2490.withoutTrial": {"trialLength": 0, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.999.monthPaidTrial": {"trialLength": 31, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.999.withoutTrial": {"trialLength": 0, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.1490.monthPaidTrial": {"trialLength": 31, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.1990.monthPaidTrial": {"trialLength": 31, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.1990.withoutTrial": {"trialLength": 0, "subscriptionLength": 366},
        "app.momeditation.mo.subscription.year.2490.monthPaidTrial": {"trialLength": 31, "subscriptionLength": 366}
    }


module.exports = {nonConsumable, autoRenewable}
