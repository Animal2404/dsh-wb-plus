# dsh-wb-plus

Community-enhanced WorkBuddy integration for DeepSeek Harness (DSH): dual CN/global account pools, credits, usage analytics, model tiers, and cooldown/model-limit status.

> This is an unofficial community build based on the MIT-licensed
> [`dingminhua/dsh-connect-workbuddy`](https://github.com/dingminhua/dsh-connect-workbuddy)
> plus local patches. The internal plugin id remains `dsh-connect-workbuddy`
> so existing installs keep working; the repository and display name are
> **dsh-wb-plus**.

## Highlights

- **Dual providers**: `workbuddy` (CN) and `workbuddy-global`, usable side by side.
- **Account pool**: credits, ready/cooling state, success rate, call counts, last success, check-in and add-account flow.
- **Model management**: credit multiplier, image support, context tiers, max output and reasoning levels per model.
- **Separate account vs model limits**: account-wide cooldown shows `冷却中`; a single throttled model shows `模型限流` plus its reset time on the model row.
- **Usage analytics**: hourly stacked chart plus per-account / per-model / per-region tables with input, output, cache hits, failures, latency, speed and tokens per credit.
- **Durable usage ledger**: hourly buckets persist across restarts.

## Install

Requires a signed-in WorkBuddy desktop app.

```sh
git clone https://github.com/Animal2404/dsh-wb-plus.git
dsh plugin --profile web add link:./dsh-wb-plus
```

Restart the DSH process after installation. The plugin reuses the desktop app's sign-in and never hands the WorkBuddy token to the DSH model adapter.

## Verify

```sh
npm run check:syntax
npm run test
npm run render:harness
npm run render:check
```

`patches/dsh-connect-workbuddy@2.0.2.patch` is the full pnpm patch over the upstream package. Applying it to a pristine upstream checkout reproduces the `lib/` files byte-for-byte.

## Credits

- Upstream: [`dingminhua/dsh-connect-workbuddy`](https://github.com/dingminhua/dsh-connect-workbuddy), MIT, Copyright (c) 2026 LaoDing.
- See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the full notice list.

Unofficial project; not affiliated with WorkBuddy, CodeBuddy or DeepSeek.
