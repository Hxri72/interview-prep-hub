---
title: Best time to buy and sell stock
order: 27
difficulty: Easy
pattern: Single pass
topic: dsa/buy-sell-stock
---

## 📝 Problem

`prices[i]` is the price of a stock on day `i`. Buy on one day and sell on a **later** day. Return the **largest profit** you can make. If no profit is possible, return `0`.

## 🧪 Examples

| Input | Output | Why |
|---|---|---|
| `[7, 1, 5, 3, 6, 4]` | `5` | buy at 1, sell at 6 |
| `[7, 6, 4, 3, 1]` | `0` | prices only fall |
| `[2, 4, 1, 7]` | `6` | buy at 1, sell at 7 |

## 🤔 Think first

:::hint
If you sell **today**, the best day to have bought is the cheapest day **so far**. What do you need to remember as you walk forward?
:::

## ✅ Solution

:::solution
**Way 1 — Brute force (every buy/sell pair)**

```js
function maxProfit(prices) {
  let best = 0;                                         // no trade = 0 profit
  for (let i = 0; i < prices.length; i++) {             // buy day
    for (let j = i + 1; j < prices.length; j++) {       // every later sell day
      best = Math.max(best, prices[j] - prices[i]);     // keep the biggest profit
    }
  }
  return best;
}
```

Time **O(n²)**, space **O(1)**.

**Way 2 — One pass, track the cheapest day**

```js
function maxProfit(prices) {
  let minPrice = Infinity;                       // cheapest price seen so far
  let profit = 0;                                // best profit so far
  for (const p of prices) {                      // walk through the days in order
    minPrice = Math.min(minPrice, p);            // update the cheapest buy
    profit = Math.max(profit, p - minPrice);     // best if we sell today
  }
  return profit;
}
```

Time **O(n)**, space **O(1)**.

**Dry run:** `[2, 4, 1, 7]` → min 2, profit 2 → min 1 → `7 - 1 = 6` → `6` ✅ (the old min 2 would only give 5)

**What to say:** "Brute force checks every pair, O(n²). Instead, I keep the cheapest price so far. Each day I ask 'what if I sell today?'. One pass, O(n) time and O(1) space."
:::
