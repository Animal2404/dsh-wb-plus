window.__ModuleLoader__.load({
	id: "dsh-connect-workbuddy",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/status-paths.ts
		/**
		* Node-free constants and types shared by the Host and browser halves.
		*
		* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
		*   — 「3 条同源只读路由（usage / models:refresh / accounts:refresh）+ 一份
		*     与浏览器共享的 node-free 类型定义」的 host↔client 桥梁形态来自该项目
		*     （其 `status-paths.ts` 亦如此，并注明沿用
		*     corrinehu/dsh-workbuddy-connect 的 status-route 模式）。
		* 改动：路由路径改用本插件 id；类型字段按 WorkBuddy 上游实际给出的能力
		*   （积分倍率、多模态、推理档位）调整，不保留 trae 的 1M 变体字段。
		*
		* @module dsh-connect-workbuddy/status-paths
		*/
		/** Plugin-owned usage endpoint consumed by its browser half. */
		const WORKBUDDY_USAGE_PATH = "/plugins/dsh-connect-workbuddy/usage";
		/** Plugin-owned live model refresh endpoint. */
		const WORKBUDDY_MODELS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/models/refresh";
		/** Plugin-owned local account rescan endpoint. */
		const WORKBUDDY_ACCOUNTS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/accounts/refresh";
		/** Plugin-owned daily check-in action endpoint. */
		const WORKBUDDY_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/checkin";
		/** Query parameter naming the region a card request addresses. */
		const WORKBUDDY_REGION_PARAM = "region";
		/** Every region, in card tab order. */
		const WORKBUDDY_REGIONS = ["cn", "global"];
		/**
		* Address one region's status route. The two regions are separate provider
		* stacks; every card request carries the region whose tab the user is on.
		*/
		function withWorkBuddyRegion(path, region) {
			return `${path}?${WORKBUDDY_REGION_PARAM}=${region}`;
		}
		/**
		* Project one card row into its persisted `lastCatalog` shape: the native
		* context window becomes the stored `contextWindow`, and the card-only
		* presentation fields (`nativeContextWindow`, `multimodal`) are removed BY
		* KEY. They must never be set to `undefined`: explicit `undefined` values
		* survive `structuredClone` and are rejected by the settings write path's
		* strict JSON codec (`client api: settings/mutate rejected "ops"`), which
		* fails the whole save.
		*/
		function toPersistedWorkBuddyModel(model) {
			const { nativeContextWindow, multimodal: _cardOnly, ...rest } = model;
			return {
				...rest,
				contextWindow: nativeContextWindow
			};
		}
		//#endregion
		//#region src/client/icon.ts
		/**
		* Plugin icon (LD brand logo, 64px) shared across the LaoDing plugin family.
		*
		* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
		*   — 同一 data URI，其注释说明来自
		*     dingminhua/dsh-subagent-default-model（MIT），用于让插件家族的
		*     外观保持一致。本项目沿用同一图标以达到同样目的。
		* 改动：无。
		*
		* @module dsh-connect-workbuddy/client/icon
		*/
		const WORKBUDDY_PLUGIN_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAXGUlEQVR4nH1bC7BdVXn+1tr7nHPvzb3JvUloSAQp0JHWoAMttKOCFrWU8irQSbCTQYG21IahnTJUUTsM0FJhZCzCSIcKImOpDkhrhQ5YC7ROB3lUBU3EyCuBFBIIedzcx3ntvTr/a621TwIns3PO3mfvddf/+v7v/9c6DvYKoYBz1cZNYfJpVBcNBm7dcIhj3TBM15VzqAE6XAWEGggVADroOl0byDW+PtRr9E732rl9r2PxOMNsrCogVE7PA0Kge4Lcz5/TGI6v00UaK+h98u4QUA9quIDg4Pe2i2LTsknc++mzZu9cv37VHNaFAveSJICj/9aFUNzrXHXSTwdnznl/Y+X9MaEP1D0A/ToKaUdDASoAK0YVYcLad/G88S6C1aQcOkI2Nj9HylBFBRMYqPUeFp6EDXQfKcIUoud6LQQP59rwrsBEOdhy9KGDK/7j9mUPmBKcCf++Z4YbF6eKLw+6QFioKl/DoYILlXMsHE2KPCCzwlsqoNb3oUw4Kq+2a0k4G4MtXOX3J4HNyulzUkC0eqYI8ZAaQZQSAh9080Qx1m7jHStnL/3B3ctvXbcuFOwBH/p5OG12DA/29leV6wcHeI8hadE1rBldl/6ACs7WMEuz0PIcKawe0Gdzeyf36eTzcOHxVAEpTEQB0QtY0PRZPMYsX+t3tSqBxkteYeHh6qqu6yIsmVhaHHtE7/fu/8fJhzzF/OywunXQR+DJOO9pkLp2NJ64pIXhaOxb/IfmJM29PemSJ+NSzJP1s2dhwmucJ6uaoIYFzVjnkFDhLRTkb2XC03gQTKDrZNjSV1icXwzPv9y99Z5Hw6R/psQnqoniyLBQ1d65IoGiDqZuHwWwzyFzx8xl5RDBZR4uCZc9E8fS+8TdSfHZ2KxAel6VwEIYZiflxC9NKToeKcKrAcjV2d2DK3xYqOcXJ478ytf2fcL3htWGegAaSZGeBnKixWgVPXRiZpEomLq4Kcri2RCc7zN3NWuq5XlOJLwqjq9liqlHlEfzSveIdVk0Fjh5kVjdjKLneniCtcEg7N492FBWAWvrHpwLzgmYUfySi+VorcJFBE6I7jIAjFnC3DybePKE5ClxLLsPI0q3kNAsYJ4g1wjkzDuju4nQJrx6RxRe/7YHfFX3MOyHtaUHloaKcqa4rcQTDWxubHnZ0lESNoaGXad7+RmLc7GMxbS4s8Y82S3mdhMshR+Po4pk181jkx22afHc8hL3plNTjOGDjEfu7pxfWkpcyA02Ofo6xpylPsMCi3eNTROShVawM0H4+4bXaGqzcTKQzc8j6VGPkb9tFtU56bwlBdK9ZMQMKNgolMtVKepFcq6hBMAzQJAQ6srG9iwNJRfN0LtWd64z1qZjRPDieBYQkyNTqFpCsoYoKQFoFt8xhA5icZ2fXWOwY4GScsT95Tv7XoSnd0ehgLJBSPSdkdhYWbSeAk2eCSzuScDs/qQo9dpRZarVWWm5ZRuxn8YRRabYtiwhn5PVRXD9js8FzM2rowKII7MnOJSR2GSZJMVUckfzjIjKMe2p5fOsENGfPESR38AwB8AsZTUBUV025TwWVEAsubSl6gYA8rU6eUMmvE2ErjMrQEDZQGkewGI6TcqPAhlT1hHBBV0xZC/R3B09JFmdXDESrIz5GRPMlWQA6kNAoVbjf7FAyq1vsW8xrt+rImI4aEiwIuqAMjI9y/8Z5RSAS+f04P4uTcihozDLaO6kZup2gSWFIXjm3plb75sHxkugMKzAgWmQcYmsTvqrgPkuMOgHFAhY0gnolDJfOgTM0t/xMcYTJeZz9QZRgHiUd5AQIHe2fNqIY3o4xiEw3wc++A6HvzweWNbWtKmsrF853PFEwDd/LEqoVOiYQQLQ7QGXn+Zw3okOhc9i1tw8umpS7mBQ4PW9Ab/YVuHxTTV+8EyF7TsqTHQCxtsBlVWSUVBViGYHcnMDQvaUyAv03wmPDcP8ECiy2lwOKl4CFz2+AoYDx1b73rkOayaVfUXziRMu9oGTbg54cz9pNlV9FEJzi8CJv+zwwOWWoZvZfXSst3rteDPgXx4e4LZv9fDS9grLlzotkclDakmXJCCFTswAdC5eZQqphwErZgr40QInAh4XHMbsHGt6ugSmWuLZwyqwlclFhwqOrSJgZky+izydc7bj+1ZPy7P9AT2nz/MR+PuK/g6/50fg8QdDGffQFQ4b13fwyFcmccl5HczOUgVYoXTcAGEBSWBzdRY4hoLUBvGeQGFgrM84gMWglq/mwszXqcSlAahgdi57l8/Mr9gaxiqbnZwheZMU23Lw88zN0zWff5ZzCpeyAApqTNWkjBorljnceMUEbvnMEqK0qIc1A6UAnYQS5/6Md4jTNxlhGUkKRYYBHmHCiEewJxQjzmmenFdphiXsZ0aKstogvmwkEiqwYml6MmS6kQkQKcUlICsIY6hyDAEbzupgZgr448/OouyI5Y3t8YgGfq5OIaHfeiZDWXclFizWw1OmF0lRQ4A8UWevnPTEsTNFjoQ7fV0UDq3SoSyBVgmU/FmOVsuz9VmfrCUBMPIMut4f1Dj9tzv4wqcmORzIvW1qwgOcYIC5vB0gzAClQW1EGuJXkgql2MlyuTHFhg4OAlrm8vRxtHrMFUhRV4trv/hawK3fqbF/QSwoYwSUPuCwlcDJ7y3wgeMKFHAYDgN7gOmwLBwGgxobzhnH/z7Txz9/exErpz2HK1teUZ+tTSGXZYZCFGAc3eqBZsESmZs1L0e92HK5TikSKA2N2CMY8QATfuvOgLOvqrBlW0CnyOioeWVF1/v4rXd7/M2fjeGEtQWGFO+FpkzFFPKOv/7zKXz/sR5m99foUJ2rRRNhhwCfAqBOxQkbVObHKSv14UZb2KnFdBAl5CdxvMwDcnotrTsW/vW9wPnXVdi2M+DwQ4DVK4CZSWDFVDp+aRkwNR7wxE8GOOuyWdz3vT7K0jMGyN8ToKTzFTMel2yYwPxcAJe56voR/eO7tOscY0Ls2GSFkJW+Nue8QTn6agJD6gta5mhwf7mHhCdesOGGCpu3AmMthzv+qsTHf6fArj0SP5YGKXNQZpleArRcjU9ePYdHnxgwPrAStK1EXkBhvO7scRx+aIleL2SWTzFP1qdQYkCs6dx66COob/28mB61GjzACwhmc9Q2rxnt/9GfUGwY1g4XfbHG488GjLWAmzYWOOU4zwAoKG6KteYG8YSAdunQKQM+dcMc9uwLbHnRv9Baumf5dIGPnNTB4jx5gQjNgisNLuH0Gr07ygKpjpdKsFnWGiuMXtLwfaPDpoRk/dFqjcYht6Q7P3lzhQefqvn87y4usOEjkgpjYlHhyT2psjMLErOcHANe3DbAXfd1xfUZVzRH6qMf/VA7E15JkfECdX9TiB+11ughDcisQGr4+wEfDqzrtegRxAau+aca3/gvEejK8z0uOcNhsUfWtAJGviOhrWKLXRwujgImx4Fvf3cR3V7gLGBRyDnfBbxnbQurVlImqJlEmdtLSpS/I9dACpD0l+I+sTjLCNbLe3sekHlEJry5/tJxh/98usZtDwo1vfTsAp/+mMeA0hrnPssalgl0PtoEEUYn18fbDltfHmLzlgEcs0MtiZ0oY+UKjyPWlBj0lRVGy3s+J2VQreKZIGUWq7MFDMEBaW01yMyoC7iRwmikG0zaZo5BcTwE9s0FXPS7Hp+/2DO356rQquKsvy9NDWV2yuXlM4Eb0O8FbN4ieTnCheIAKWLNao9qKPm/gJdD6bfhQkHlMLE9QmouF7Mlq1geM/hpO2xU/oNciT2K2B0Wik1/cHYu4Jz3O9y80bNXCOAJfnCzRAeguUhxbF0e7eLwMyIUKeW1HRkoWS9QXzPTnmWQvoOkQMED5Q8UDnDUE0ytLVv6jtbTyae6IP8T2qczNhKbAymLWP4nwXp94IhVDv9wWcGWoBRHHD/Fr8NPn6/Q8lpFpqCKwEgCGLsjF+4umOs3nZJeS8Y8ilrSHV0kazPqq6J5BRQylsgR4z2rALXhmWWkt8CAZvES49/aYDTZXsDxRzksnaDcTqAnz5DLtkqPux8c4LuPDTjfE9rnq0ziFUpotJfH4WFdjthUSbOjMdjFSXCtWg0EyyC9DU+fWcNq6UaDMq7tExJn6fFt3J+vKmPkZog9p4wqhoc6Dwvf8vjOfw9w+RcXucNj7e+0kpPa4wZmHDg1sHK5FAVCBXRgndb8XB2boj4TmBkgW9+AsLIOr/X6m/TX1uxjiyz3AOvjNQODMcVqb1GKrtrQ83qRQoCEf+SpITbeQJsSrLcnbhOR2zVZnBU0pXc46ghRAI+phMzGf3NnjRYBLOEPK8DzOxMheqcqFF5DIF+dyRZIYkhEgpJiNmn7wGIokhlLXWzNlEeHKvyTm4f4o+sWsdgNWHuUx2RHlG2KYDfniSaGyIUMMb4Zz/k+F5pGpyKp263x6v9VaBOztNyv40RmqGsG3o30+SMQZvXBAQsdb/UaJVTRdaVHZ2sPY22HzS9WuPDaLnbuqnHWySUe+vIU/uCjbcxRIUPpylKfeQMjuLTHF+drHH9sC2tWlxxGRKJiFADY/nKFXTsqjLUpE2jsx3Qq6C8A6CQEuP2V1wCNNfpmamvG/wg6amzLOmESPh+D0P7FVwMuuHoRW7dXOP19JW79zDjaLWBqQsLGipXo9jpZa2tTuG742EQmtKZSpcU/+VEf3fmANhVDbHnJGpEa8zUnxVK+o8N4fFx/H2F/MSXl3VvrBzhqUUmIJHdNedyAcfvrARdc08WzL9U4+bgSt181jjEFP1tljiVsrOHFAzothz27a5xx6jhOfn8HVUVU12YkvUR6/c/DPXQKEi4VPkyIuDrMiqNA3pbz/tGV29j3N68QetLweWuKKEOjdjMpsMX8Sb6nt2VLgCd/VuHMK4Z44ZUK7z26wJ1Xj2N6ynGKHOvYjhR6XumrKpFkbBfAnjcrrD2mhc9dORXpb5wJhULh8dzPB9j0wwEmlxDZMM9JyC9VoGQmz7wgU0Bc089dfqRCPKApqqsutCRGrarTf8PhjT0Bu2cDdu8L2LOvxu69AbP7A3a8UeEXWyu86zCPr187jjWHNFtclvqoFUZkiRRKf6/fDdj1eoXf/PUObrtlBstnpIVH1aB5IydBB3zr6wvodym/Sy9AKG8qi1NPgOixk7XBfJ0ub2o2lJBVdY2YsK6MFiWfO9/jnSuBHz1HHuGFSmuKC5XH6uUOHz+jhdUrndQChSiBXtTEoLRHQFj1a47bibbDrxxR4twzx7Bh/QTKlvCHKLzyf+oSbX66j0f/vYtlU1K/MAFSdyceEIVXAxdxeVy5fwPtRxHd9vw0GqBqIn4zWhpw4akeF5769gmDeADFr1mOXq/urHkN8Nyzx3DGKR20yoBDVhQ4+siSFUVWr014fZCUTue9bsCXrtsfOQIxWxNamiAKiOwZojxPHmBr75a/Y2hpP988pMEHYsfT1u0TEaFTyvMCS9m9htTWpIwlMMWuw8JizV3do99Z4PNXTnHLK9UXQemz4/rBhmW84naYw99fuw/PbR5g5XTBniwIT9bWuHcS+8YraAAfGyIZBlgGyHd45fv4UsTZW+rGmB7KghoVQkqK/J1XeEiIlLRJWRQ+DzzSx8+2DHHqB9osfK9Xs9DkKZRdpAucApDcXsb2uOX6WTz0r4tYQcIPc0HT59QBSpmgsBCILa98BSfb0jKa7jMAOEhTJOmGU2C85BCoINEvyT9IwHbL49WdFW68bZ6Xu9afPcZ3m+KUPFiASQiQkkuP/ftr3PS3s3j4/i73Aql+sc4vC6+rQIL2Qs+NY6QQqG0zZEZYLC2mYowfokVN1n6dGg/NV8YPzF1iBORlFK36BLS956XuP/3sPjy7ZYDL/2QJjv3VEr2+FDK8yKrZIa0byvS//0gPt39pDttfqHiVF4NEm2PDU0tgvpZ7AdMXMUZpW1Kb+4GaqY8+twpgx96A+x4PuPjDsmB54GukX3DQl1yfXwDuf7SHm766gJdfGeIPf38c11wxxd91aO/BQV673qjw1BMDPPhvi3j6yT7GSoeZZbKIa2UyNb3yJqitBebub6tPnosj22010rsf3exEgDNRAld9o8aPX3B412rdB2xgl1Hf0CiEMseoA3r9gG3bK/xw0wAvbB1iqkMkyeOw1QW+9s0FDAeCFeIwAYNewK5dNV7ZWmHb80O8uaNmUrR0Uqo6WgITmptITlRAg1LnZMiIEODec8MwkDV4707+A4isCHJD2cNr3GDfHLi/Z3v4448Xsj38EiepEOLqTru8RaDdHeDtLrZldn6/LnHbhLlNpwQmAB3vMNFxGOPtNZrmaqvzpbYXzm/ARyWvl4YIdYbU/Rn4CFMqYGq5ly0yVqUdUMnZ6q4Bl94zM2E9xGztTxc045aavK1Of1wxxQWiqDULYJuj6G/QEje7byAl6IT1YAF0H7HsKpUmjVV4eakcra6rwlIP6DJYtkbA6Ri8P0CB1jYv5u2lvBoULsfnnJpG9vCyIEqWZHeJrjJn48adGrzzSyZgGxek2ySeZqFjz3FjNd/vo0JKw8QEVgVqt0iKH1sDlBTKy+r6TLBx6nwFuPGefpMTc79Z3RRkPXw+H21njVSPcQ9fanXbWLymb/1/29RgkKmNTRuLBVXrxx0m+lkENmVY7S/zEWtrb9BWiRxlgZGCJ+a9PLHlfEDBTP2hsTFRdpVJNWdPx21qWVPDWtP5ik+j4Zn176wFzoWN9fcyoDNhI+dXppkA0XoCTQLEPCAIdhxk5Tur+nWPsChKYzxH97h/37aqm+z2Sw7ZvGRa5x5c3IuUlBBbVBYWBlymuEx4Gyuv74X4pDTXYILWD8ja4zRKYVR49Fcdxg3invt8yUsVJCRPHshrBWNZ+R49UYLt5tYfRcR6Xy0c3Ta5dJ6/Zd/vCNjlxCcueCa2l1pgGQDGzpIVSEPMyq6w5q+wzOoNUIzu0uz0SFhkHlHTiq4InO4zr9ENSjHO841N2e5ui3PrBTZQPFlagC0Jb54Vd4pZqNiOttgPoI4AZn1ZYLPzLoQatS2CNmod3T3W7Asc+Puc5D1JKRbpRJnFYgZAI9iQub7EvY9gxc9yW1vW+HgME3KkwSkNDs0EVnXqWqARIG3X1y3XDq0xbPbTS4q7vVcCN7qwGWM73/HV3P0t7iwImoOhlMZpe0rc8q7tblaE9vxzJaTCJa3nC/iZp6QFTgNGi/0mC9TvOTukUNLUG8Y6hZte7e/2l52Iu8ar6qXalR6hrhq5P0+LI7/DaYBgrHnMve1HEhYu6RkWgq2bvKDJ3cVGOfhZLOdYkaq8xPIYX2zVV72uyPBEN01XnTDuy2WLL33w+rG7/PpT3NyvrQ4bx9tww8qT1ejHNHFPQEJ6Ke0E1LJd2FmhR90g04xpP+tfKCjmYKaWIU/ImhcpTpXi2q7UfLeH9fXVqSVsTNiMD+Rh4uraDT2mlpXu8BNaG1etcnN+3T2huPcvWg8dubS6dHJJUfD6bFVXrq5rrw3+tCaXOuGmBENzAzHpu0tvL63uNj8bykdeoCkt8QHL+SqAkRxz60wJcQ9BFh6p7CX8CYEQLtShKocTfmbpRLHs3d1LT7u+9dA99tNZ+yHxBTcNztz0mr9x74I/hnZXhD7F/PCAn6bJz+U0vrPr7K5VJUJZf5/v040NDcG02LGGJVmfOsuxdifg03U9vUZHrPz0fl7p5caGjNkiEmTFUXBooUDbjWGs5TE+Pdyy6vjqijO+MPYACb+efjwdiYsqIewMk+d8tbro1b1uXXehPrYahmn+hZmGgtefqsalNFvU1BpAhM8QXhUlCmgCmihAUnBUQixk6J2eSYqwvM9Iz5sfrApM7LDF7W651oILbef3Tky0Nk2vcfeed0dxp3Nu7h6EYr2sgOL/Aa5OuMdnE5sWAAAAAElFTkSuQmCC";
		//#endregion
		//#region src/client/styles.ts
		/**
		* Client styles for the WorkBuddy plugin card.
		*
		* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
		*   — 整套 `dsm-*` 卡片样式系统（卡片外壳、按钮原语、`--dsw-alias-*`
		*     主题变量与十六进制回退值）逐字沿用自该项目，其又复制自
		*     dingminhua/dsh-subagent-default-model（MIT）的 SETTINGS_CSS。
		*     沿用目的是让两个插件共享同一套外部表现语言。
		* 改动：类名由 `dsm-trae-*` 改为 `dsm-workbuddy-*`；
		*   移除 trae 特有的 1M 变体样式，新增按套餐聚合的积分行样式；
		*   双 provider 化后新增国内版/国际版 tab 栏样式。
		*
		* @module dsh-connect-workbuddy/client/styles
		*/
		const WORKBUDDY_CARD_CSS = `
.dsm-plugin-card{border:1px solid var(--dsw-alias-border-l2,#36373b);background:var(--dsw-alias-bg-layer-3,#202126);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
.dsm-plugin-card:hover{border-color:var(--dsw-alias-label-dimmed,#777)}
.dsm-plugin-card-open{background:var(--dsw-alias-bg-layer-2,#25262b);border-color:var(--dsw-alias-label-dimmed,#777)}
.dsm-plugin-card-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.dsm-plugin-card-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5686fe);outline-offset:-2px}
.dsm-plugin-card-head{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.dsm-plugin-card-title{color:var(--dsw-alias-label-primary,#e6e6e6);font-size:15px;font-weight:600;line-height:1.4}
.dsm-plugin-card-description{color:var(--dsw-alias-label-tertiary,#999);font-size:13px;line-height:1.5}
.dsm-plugin-card-chevron{color:var(--dsw-alias-label-tertiary,#999);flex:none;display:inline-flex;transition:transform .16s}
.dsm-plugin-card-chevron-open{transform:rotate(180deg)}
.dsm-plugin-card-body{border-top:1px solid var(--dsw-alias-border-l2,#36373b);margin:0 16px;padding:0 0 8px}
.dsm-plugin-card-icon{width:32px;height:32px;flex:none;border-radius:7px}
.dsm-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.dsm-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5686fe);outline-offset:1px}
.dsm-btn:disabled{opacity:.4;cursor:default}
.dsm-btn-outline{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:transparent;font-weight:500}
.dsm-btn-outline:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed);background:rgba(255,255,255,.04)}
.dsm-btn-primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.dsm-btn-primary:hover:not(:disabled){opacity:.9}
.dsm-workbuddy-usage{display:flex;flex-direction:column;gap:16px;margin:0;padding:16px 0 4px}
.dsm-workbuddy-tabs{display:flex;gap:6px;padding:4px;border:1px solid var(--dsw-alias-border-l2,#3a3d45);border-radius:10px;background:var(--dsw-alias-bg-layer-3,#2a2c33)}
.dsm-workbuddy-tab{appearance:none;font:inherit;cursor:pointer;flex:1;border:0;border-radius:7px;padding:7px 10px;color:var(--dsw-alias-label-tertiary,#999);font-size:13px;font-weight:500;line-height:18px;background:transparent;transition:color .15s,background .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsm-workbuddy-tab:hover:not(:disabled):not(.dsm-workbuddy-tab-active){color:var(--dsw-alias-label-primary,#e6e6e6)}
.dsm-workbuddy-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5686fe);outline-offset:1px}
.dsm-workbuddy-tab-active{color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,#232529);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2,#3a3d45)}
.dsm-workbuddy-tab-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:baseline}
.dsm-workbuddy-usage-account{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2,#3a3d45);border-radius:14px;background:var(--dsw-alias-bg-layer-2,#24262c)}
.dsm-workbuddy-usage-account-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
.dsm-workbuddy-usage-expiry{padding-left:19px;color:var(--dsw-alias-label-tertiary,#9aa0a8);font-size:12px;line-height:18px}
.dsm-workbuddy-usage-hint{padding-left:19px;color:var(--dsw-alias-label-tertiary,#9aa0a8);font-size:12px;line-height:18px}
.dsm-workbuddy-account-picker{display:block}
.dsm-workbuddy-usage-select-wrap{position:relative}
.dsm-workbuddy-usage-select{appearance:none;width:100%;font:inherit;padding:10px 34px 10px 12px;border:1px solid var(--dsw-alias-border-l2,#3a3d45);border-radius:10px;color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-3,#2a2c33);cursor:pointer;transition:border-color .15s,box-shadow .15s}
.dsm-workbuddy-usage-select:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary,#5686fe);box-shadow:0 0 0 3px rgba(86,134,254,.22)}
.dsm-workbuddy-usage-select:disabled{opacity:.6;cursor:default}
.dsm-workbuddy-usage-select-wrap::after{content:"";position:absolute;top:50%;right:12px;width:7px;height:7px;transform:translateY(-65%) rotate(45deg);border-right:1.6px solid var(--dsw-alias-label-secondary,#c6c9d0);border-bottom:1.6px solid var(--dsw-alias-label-secondary,#c6c9d0);pointer-events:none}
.dsm-workbuddy-usage-text{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary,#b8b8b8)}
.dsm-workbuddy-usage-error{margin:0;font-size:14px;line-height:22px;color:var(--dsw-alias-state-error-primary,#ef4444)}
.dsm-workbuddy-usage-dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto}
.dsm-workbuddy-usage-status{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:500;color:var(--dsw-alias-label-primary,#e6e6e6)}
.dsm-workbuddy-credits-panels{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(150px,.8fr);gap:10px}
.dsm-workbuddy-credit-panel{display:flex;flex-direction:column;min-width:0;gap:7px;padding:14px;border:1px solid var(--dsw-alias-border-l2,#3a3d45);border-radius:12px;background:var(--dsw-alias-bg-layer-2,#24262c)}
.dsm-workbuddy-credit-panel-title{color:var(--dsw-alias-label-tertiary,#999);font-size:12px;line-height:18px}
.dsm-workbuddy-credit-panel-value{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:15px;line-height:21px}
.dsm-workbuddy-credit-panel-meta,.dsm-workbuddy-credit-panel-empty{color:var(--dsw-alias-label-secondary,#c6c9d0);font-size:12px;line-height:18px}
.dsm-workbuddy-credit-monthly-row{position:relative;display:flex;flex-direction:column;gap:3px;margin:-14px -14px 0;padding:11px 14px 10px;border-bottom:1px solid var(--dsw-alias-border-l2,#36373b);border-radius:14px 14px 0 0;background:var(--dsw-alias-bg-layer-2,#24262c);overflow:hidden}
.dsm-workbuddy-credit-monthly-row::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;opacity:.9;background:#9ca2aa}
.dsm-workbuddy-credit-monthly-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:14px;font-weight:600;line-height:20px}
.dsm-workbuddy-credit-monthly-meta{color:var(--dsw-alias-label-tertiary,#999);font-size:11.5px;line-height:17px;font-variant-numeric:tabular-nums}
.dsm-workbuddy-credit-packages{display:flex;flex-direction:column;gap:5px;margin:0;padding:0;list-style:none}
.dsm-workbuddy-credit-packages li{display:flex;align-items:baseline;justify-content:space-between;gap:10px;color:var(--dsw-alias-label-secondary,#c6c9d0);font-size:12px;line-height:18px}
.dsm-workbuddy-credit-packages li span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-workbuddy-credit-packages li span:last-child{flex:none;color:var(--dsw-alias-label-tertiary,#999);font-size:11px}
.dsm-workbuddy-credit-soon{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:9px;padding-top:9px;border-top:1px solid var(--dsw-alias-border-l2,#36373b);color:var(--dsw-alias-label-secondary,#c6c9d0);font-size:12px;line-height:18px}
.dsm-workbuddy-credit-soon strong{color:var(--dsw-alias-label-primary,#e6e6e6);font-size:15px;font-variant-numeric:tabular-nums}
.dsm-workbuddy-credit-panel-total{position:relative;align-items:center;text-align:center;overflow:hidden}
.dsm-workbuddy-credit-panel-total::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;opacity:.9;background:#4d9b6d}
.dsm-workbuddy-credit-total-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;width:100%}
.dsm-workbuddy-credit-total-value{color:#3f8d60;font-size:32px;line-height:36px;font-weight:700;letter-spacing:-.5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.dsm-workbuddy-checkin{display:flex;flex-direction:column;align-items:center;width:100%;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2,#36373b)}
.dsm-workbuddy-checkin-button{width:100%;padding:4px 10px;font-size:12px}
.dsm-workbuddy-checkin-error{color:var(--dsw-alias-state-error-primary,#ef4444);font-size:11px;line-height:16px;text-align:center}
@media (max-width:760px){.dsm-workbuddy-credits-panels{grid-template-columns:1fr}.dsm-workbuddy-credit-panel-total{align-items:flex-start;text-align:left}.dsm-workbuddy-credit-total-body{align-items:flex-start}}
.dsm-workbuddy-models{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--dsw-alias-border-l2,#36373b);padding-top:14px}
.dsm-workbuddy-models-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsm-workbuddy-models-title{margin:0;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:14px;font-weight:600;line-height:20px}
.dsm-workbuddy-models-summary{margin:2px 0 0;color:var(--dsw-alias-label-tertiary,#999);font-size:12px;line-height:18px}
.dsm-workbuddy-model-list{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2,#36373b);border-radius:10px;overflow:hidden}
.dsm-workbuddy-model{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2,#232529);transition:opacity .16s}
.dsm-workbuddy-model-disabled{opacity:.55}
.dsm-workbuddy-model+.dsm-workbuddy-model{border-top:1px solid var(--dsw-alias-border-l2,#36373b)}
.dsm-workbuddy-model-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.dsm-workbuddy-model-enabled{display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer;flex:1}
.dsm-workbuddy-model-enabled input{margin:0;accent-color:var(--dsw-alias-brand-primary,#5686fe);flex:none}
.dsm-workbuddy-model-image{display:inline-flex;align-items:center;gap:5px;flex:none;cursor:pointer;color:var(--dsw-alias-label-secondary,#c6c9d0);font-size:11px;line-height:16px}
.dsm-workbuddy-model-image input{margin:0;accent-color:var(--dsw-alias-brand-primary,#5686fe)}
.dsm-workbuddy-model-copy{display:flex;align-items:baseline;gap:8px;min-width:0}
.dsm-workbuddy-model-name{display:inline-flex;align-items:baseline;gap:7px;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:13px;font-weight:500;line-height:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-workbuddy-model-name-rate{color:var(--dsw-alias-label-tertiary,#999);font-size:11px;font-weight:400;line-height:16px;flex:none}
.dsm-workbuddy-model-id{color:var(--dsw-alias-label-tertiary,#999);font-size:11px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-workbuddy-model-desc{margin:0;color:var(--dsw-alias-label-tertiary,#9aa0a8);font-size:12px;line-height:18px}
.dsm-workbuddy-model-details{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.dsm-workbuddy-model-meta{display:flex;align-items:center;gap:7px 12px;flex-wrap:wrap;color:var(--dsw-alias-label-tertiary,#999);font-size:11px;line-height:16px}
.dsm-workbuddy-model-meta-tag{padding:1px 7px;border-radius:999px;font-size:11px;line-height:15px;background:rgba(174,179,187,.11);color:var(--dsw-alias-label-secondary,#c6c9d0)}
.dsm-workbuddy-context-budget{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex:none;margin:0;padding:0;border:0;color:var(--dsw-alias-label-secondary,#c6c9d0);font-size:11px;line-height:16px}
.dsm-workbuddy-context-budget label{display:inline-flex;align-items:center;gap:4px;cursor:pointer}
.dsm-workbuddy-context-budget input{margin:0;accent-color:var(--dsw-alias-brand-primary,#5686fe)}
.dsm-workbuddy-model-capability-note{margin:0;color:var(--dsw-alias-label-tertiary,#999);font-size:12px;line-height:18px}
.dsm-workbuddy-model-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--dsw-alias-border-l2,#36373b);padding-top:12px}
.dsm-workbuddy-model-save-error{flex:1;min-width:0;color:var(--dsw-alias-state-error-primary,#ef4444);font-size:12px;line-height:16px;text-align:right}
.dsm-workbuddy-model-actions-buttons{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.dsm-workbuddy-usage-cheer{display:inline-flex;align-items:center;gap:4px;flex:none;text-decoration:underline;text-underline-offset:2px;color:var(--dsw-alias-label-tertiary,#999);font-size:13px;line-height:1.5;transition:color .16s}
.dsm-workbuddy-usage-cheer-star{font-size:12px;line-height:1;display:inline-flex}
.dsm-workbuddy-usage-cheer:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}
.dsm-workbuddy-usage-cheer:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5686fe);outline-offset:2px}
/* --- sidebar entry + panel (mounted at sidebar.footer.action) ---
   Visual system: layered translucent surfaces + hairlines instead of hard
   borders; custom-drawn controls instead of browser defaults; motion limited to
   transform/opacity with a strong ease-out curve. */

/* Scoped tokens so the entry and the panel share one system. Declared on both
   shells - the sidebar layer AND the main-area view root - because the tab is a
   sibling of the sidebar, not a descendant of it: scoping them to the layer
   alone left every token-dependent border and surface undefined in the view,
   which is why the tab rendered flat while the popover showed cards. */
.dsm-wb-side-layer,
.dsm-wb-view-root{
  --wb-ease-out:cubic-bezier(0.23,1,0.32,1);
  --wb-ease-in-out:cubic-bezier(0.77,0,0.175,1);
  --wb-accent:#5b8cff;
  --wb-hairline:rgba(255,255,255,.07);
  --wb-hairline-strong:rgba(255,255,255,.11);
  --wb-surface-1:rgba(255,255,255,.035);
  --wb-surface-2:rgba(255,255,255,.055);
  --wb-surface-3:rgba(255,255,255,.085);
  --wb-text:var(--dsw-alias-label-primary,#e9eaec);
  --wb-text-2:var(--dsw-alias-label-secondary,#b8bcc4);
  --wb-text-3:var(--dsw-alias-label-tertiary,#8b9099);
  /* Room at the bottom of the tab for the host's floating composer dock, so
     the last rows can be scrolled clear of the input instead of sitting under
     it. Measured against a session view with the composer fully expanded. */
  --wb-view-clearance:190px;
}
.dsm-wb-side-layer{
  position:relative;flex:none;display:flex;align-items:center;width:100%;margin:4px 0;
}
.dsm-wb-side-layer.dsm-wb-side-rail{width:36px;height:36px;justify-content:center;margin:6px 0}

/* ---------- collapsed entry ---------- */
.dsm-wb-side-trigger{
  appearance:none;display:flex;align-items:center;gap:8px;width:100%;height:42px;
  padding:0 10px 0 8px;border:0;border-radius:12px;background:transparent;
  color:var(--wb-text-2);font:inherit;font-size:14px;font-weight:500;line-height:20px;
  cursor:pointer;overflow:hidden;
  transition:background-color 160ms ease,color 160ms ease,transform 160ms var(--wb-ease-out);
}
.dsm-wb-side-trigger:focus-visible{outline:2px solid var(--wb-accent);outline-offset:-2px}
.dsm-wb-side-trigger:active{transform:scale(.98)}
.dsm-wb-side-trigger[aria-expanded="true"]{background:var(--wb-surface-2);color:var(--wb-text)}
.dsm-wb-side-rail .dsm-wb-side-trigger{justify-content:center;gap:0;width:36px;height:36px;padding:0;border-radius:50%}
.dsm-wb-side-icon{width:16px;height:16px;flex:none;border-radius:4px}
.dsm-wb-side-trigger-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Credits read as a stat chip on the entry: quiet surface, tabular figures. */
.dsm-wb-side-credit-badge{
  flex:none;min-width:0;max-width:52%;margin-left:auto;padding:1px 7px;border-radius:999px;
  background:var(--wb-surface-1);color:var(--wb-text-2);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-size:12px;line-height:16px;font-weight:500;font-variant-numeric:tabular-nums;
}
.dsm-wb-side-rail .dsm-wb-side-credit-badge{display:none}
/* No figure yet: the pill stays put and reads as unknown, never blank. */
.dsm-wb-side-credit-badge[data-unknown="true"]{color:var(--wb-text-3);opacity:.7}
/* Request in flight: dim the figure rather than moving it. */
.dsm-wb-side-credit-badge[data-busy="true"]{opacity:.5}
.dsm-wb-side-trigger:disabled{opacity:.5;cursor:default}
.dsm-wb-side-trigger:disabled:active{transform:none}
.dsm-wb-side-chevron{
  flex:none;margin-left:6px;color:var(--wb-text-3);font-size:12px;line-height:1;
  transition:transform 200ms var(--wb-ease-out),color 160ms ease;
}
.dsm-wb-side-chevron[data-open="true"]{transform:rotate(90deg)}

/* ---------- panel shell ---------- */
.dsm-wb-side-panel{
  position:fixed;left:300px;top:82px;bottom:auto;z-index:30;display:flex;flex-direction:column;
  width:340px;max-width:calc(100vw - 24px);max-height:60vh;overflow:hidden;
  border:1px solid var(--wb-hairline-strong);border-radius:14px;
  background:var(--dsw-alias-bg-base,#1b1c20);
  box-shadow:0 1px 2px rgba(0,0,0,.4),0 12px 28px -6px rgba(0,0,0,.55),0 32px 64px -12px rgba(0,0,0,.45);
  --dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);
  /* Grows out of the trigger, which sits below-left of the panel. */
  transform-origin:top left;
  transform:scale(1);opacity:1;
  transition:transform 220ms var(--wb-ease-out),opacity 180ms var(--wb-ease-out);
}
@starting-style{
  .dsm-wb-side-panel{transform:scale(.96) translateY(8px);opacity:0}
}

/* Content dissolves into the panel's bottom edge instead of being chopped. */
.dsm-wb-side-panel::after{
  content:"";position:absolute;left:1px;right:1px;bottom:1px;height:24px;pointer-events:none;
  border-bottom-left-radius:13px;border-bottom-right-radius:13px;
  background:linear-gradient(180deg,rgba(27,28,32,0),var(--dsw-alias-bg-base,#1b1c20));
}
.dsm-wb-side-head{flex:none;display:flex;align-items:center;gap:10px;padding:12px 12px 10px}
.dsm-wb-side-title{
  flex:1;min-width:0;color:var(--wb-text);font-size:13.5px;font-weight:600;
  letter-spacing:.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsm-wb-side-collapse{
  appearance:none;flex:none;display:grid;place-items:center;width:26px;height:26px;margin-left:2px;
  border:0;border-radius:8px;background:transparent;color:var(--wb-text-3);
  font-size:15px;line-height:1;cursor:pointer;
  transition:background-color 150ms ease,color 150ms ease,transform 160ms var(--wb-ease-out);
}
.dsm-wb-side-collapse:active{transform:scale(.94)}

.dsm-wb-side-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:2px 12px 12px}

/* Groups: 14px between, 8px inside, separated by a hairline rather than a hard rule. */
.dsm-wb-side-group{display:flex;flex-direction:column;gap:8px;min-width:0}
.dsm-wb-side-group+.dsm-wb-side-group{border-top:1px solid var(--wb-hairline);padding-top:12px}
/* The panel body is a stack of column stacks; the seam between stacks keeps the
   same hairline the groups used to carry as direct siblings. */
.dsm-wb-side-body .dsm-wb-side-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.dsm-wb-side-body .dsm-wb-side-col+.dsm-wb-side-col>.dsm-wb-side-group:first-child{border-top:1px solid var(--wb-hairline);padding-top:12px}
.dsm-wb-side-label{
  color:var(--wb-text-3);font-size:11px;line-height:15px;font-weight:600;letter-spacing:.03em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
/* Header rows wrap: three buttons do not fit beside a label in a narrow card,
   and letting them wrap beats truncating the label to fit them. */
.dsm-wb-side-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;flex-wrap:wrap}
.dsm-wb-side-row .dsm-wb-side-label{flex:1 1 auto}

/* ---------- account ---------- */
.dsm-wb-side-account{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.dsm-wb-side-account-copy{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.dsm-wb-side-account-name{
  color:var(--wb-text);font-size:14px;font-weight:600;line-height:19px;letter-spacing:-.005em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsm-wb-side-account-state{display:flex;align-items:center;gap:6px;color:var(--wb-text-3);font-size:11.5px;line-height:15px}
.dsm-wb-side-dot{width:6px;height:6px;border-radius:50%;flex:none;background:var(--dsw-alias-label-dimmed,#777)}
.dsm-wb-side-dot[data-state="ok"]{
  background:var(--dsw-alias-state-success-primary,#22c55e);
  box-shadow:0 0 0 3px rgba(34,197,94,.14);
}

/* ---------- credits: numbers are the hero, the tile stays quiet ---------- */
.dsm-wb-side-credits{display:flex;gap:8px}
.dsm-wb-side-credit{
  flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;padding:9px 11px;border-radius:11px;
  border:1px solid var(--wb-hairline);
  background:linear-gradient(180deg,var(--wb-surface-2),var(--wb-surface-1));
}
.dsm-wb-side-credit-label{color:var(--wb-text-3);font-size:11px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-wb-side-credit-value{
  color:var(--wb-text);font-size:20px;font-weight:600;line-height:26px;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;
}
.dsm-wb-side-block{width:100%}

/* ---------- buttons (scoped: the card keeps its own look) ---------- */
.dsm-wb-side-panel .dsm-btn{border-radius:10px;transition:background-color 150ms ease,color 150ms ease,border-color 150ms ease,transform 160ms var(--wb-ease-out)}
.dsm-wb-side-panel .dsm-btn:active:not(:disabled){transform:scale(.97);opacity:1}
.dsm-wb-side-panel .dsm-btn-outline{
  height:30px;padding:0 11px;border-color:var(--wb-hairline-strong);
  background:var(--wb-surface-1);color:var(--wb-text-2);
  font-size:12px;font-weight:500;line-height:28px;
}
.dsm-wb-side-panel .dsm-btn-outline:disabled{opacity:.4}
/* Tonal accent instead of the near-white slab the card uses. */
.dsm-wb-side-panel .dsm-btn-primary{
  height:36px;padding:0 14px;border:1px solid rgba(91,140,255,.32);
  background:linear-gradient(180deg,rgba(91,140,255,.24),rgba(91,140,255,.15));
  color:#dce7ff;font-size:13px;font-weight:550;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
}
.dsm-wb-side-panel .dsm-btn-primary:disabled{opacity:.45}

/* ---------- provider tabs: one segmented control ---------- */
.dsm-wb-side-panel .dsm-workbuddy-tabs{
  gap:8px;padding:4px;border-color:var(--wb-hairline);border-radius:11px;background:var(--wb-surface-1);
}
.dsm-wb-side-panel .dsm-workbuddy-tab{
  border-radius:8px;padding:6px 10px;font-size:13px;font-weight:500;line-height:18px;
  color:var(--wb-text-3);
  transition:color 150ms ease,background-color 150ms ease;
}
.dsm-wb-side-panel .dsm-workbuddy-tab-active{
  background:var(--wb-surface-3);color:var(--wb-text);
  box-shadow:0 1px 2px rgba(0,0,0,.28),inset 0 0 0 1px var(--wb-hairline);
}

/* ---------- model rows ---------- */
.dsm-wb-side-models{display:flex;flex-direction:column;gap:2px;max-height:250px;overflow-y:auto;margin:0 -6px;padding:0 6px}
.dsm-wb-side-model{
  display:flex;flex-direction:column;gap:6px;padding:8px 9px;border-radius:10px;background:transparent;
  transition:background-color 150ms ease;
}
.dsm-wb-side-model-on{background:var(--wb-surface-1)}
.dsm-wb-side-model[data-active="true"]{
  background:linear-gradient(180deg,rgba(91,140,255,.13),rgba(91,140,255,.07));
  box-shadow:inset 0 0 0 1px rgba(91,140,255,.22);
}
.dsm-wb-side-model-enabled{display:flex;align-items:center;gap:9px;min-width:0;margin:0;cursor:pointer}
.dsm-wb-side-model-name{
  min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:var(--wb-text);font-size:13px;font-weight:500;line-height:19px;letter-spacing:-.005em;
}
.dsm-wb-side-model-rate{
  flex:none;color:var(--wb-text-3);font-size:11px;line-height:16px;
  font-variant-numeric:tabular-nums;letter-spacing:.01em;
}
.dsm-wb-side-model-limit{
  flex:none;padding:1px 7px;border-radius:999px;
  background:rgba(245,158,11,.14);color:var(--dsw-alias-state-warning-primary,#f59e0b);
  font-size:10.5px;line-height:16px;font-weight:500;white-space:nowrap;
}
.dsm-wb-side-model-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-left:27px}

/* custom checkbox — native input kept for semantics, drawn by hand */
.dsm-wb-side-model-enabled input{
  appearance:none;flex:none;display:grid;place-items:center;
  width:18px;height:18px;margin:0;border-radius:6px;cursor:pointer;
  border:1.5px solid var(--wb-hairline-strong);background:var(--wb-surface-1);
  color:#fff;
  transition:background-color 150ms ease,border-color 150ms ease,transform 160ms var(--wb-ease-out);
}
.dsm-wb-side-model-enabled input:checked{background:var(--wb-accent);border-color:var(--wb-accent)}
.dsm-wb-side-model-enabled input:active:not(:disabled){transform:scale(.9)}
.dsm-wb-side-model-enabled input:disabled{opacity:.45;cursor:default}
.dsm-wb-side-model-enabled input::after{
  content:"";width:9px;height:5px;margin-top:-2px;
  border-left:2px solid currentColor;border-bottom:2px solid currentColor;
  transform:rotate(-45deg) scale(.5);opacity:0;
  transition:transform 150ms var(--wb-ease-out),opacity 150ms var(--wb-ease-out);
}
.dsm-wb-side-model-enabled input:checked::after{transform:rotate(-45deg) scale(1);opacity:1}
.dsm-wb-side-model-enabled input:focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}

/* multimodal as a real switch: the knob travels on transform */
.dsm-wb-side-model-image{display:inline-flex;align-items:center;gap:6px;flex:none;margin:0;cursor:pointer;color:var(--wb-text-3);font-size:11px;line-height:16px}
.dsm-wb-side-model-image input{
  appearance:none;position:relative;flex:none;width:28px;height:16px;margin:0;border-radius:999px;
  cursor:pointer;background:var(--wb-surface-3);border:1px solid var(--wb-hairline);
  transition:background-color 180ms var(--wb-ease-out),border-color 180ms var(--wb-ease-out);
}
.dsm-wb-side-model-image input::after{
  content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;
  background:#fff;opacity:.8;
  transition:transform 180ms var(--wb-ease-out),opacity 180ms var(--wb-ease-out);
}
.dsm-wb-side-model-image input:checked{background:var(--wb-accent);border-color:var(--wb-accent)}
.dsm-wb-side-model-image input:checked::after{transform:translateX(12px);opacity:1}
.dsm-wb-side-model-image input:disabled{opacity:.45;cursor:default}
.dsm-wb-side-model-image input:focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}

/* context tiers: separate pills, 8px apart, the checked one filled */
.dsm-wb-side-context{display:inline-flex;align-items:center;gap:8px;flex:none;margin:0;padding:0;border:0}
.dsm-wb-side-context label{position:relative;display:inline-flex;margin:0;cursor:pointer}
.dsm-wb-side-context input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.dsm-wb-side-context span{
  display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:7px;
  border:1px solid var(--wb-hairline);background:var(--wb-surface-1);
  color:var(--wb-text-3);font-size:11px;font-weight:500;line-height:20px;white-space:nowrap;
  font-variant-numeric:tabular-nums;
  transition:background-color 150ms ease,color 150ms ease,border-color 150ms ease;
}
.dsm-wb-side-context input:checked+span{
  background:var(--wb-surface-3);border-color:var(--wb-hairline-strong);color:var(--wb-text);
}
.dsm-wb-side-context input:disabled+span{opacity:.45}
.dsm-wb-side-context input:focus-visible+span{outline:2px solid var(--wb-accent);outline-offset:1px}
@media (hover:hover) and (pointer:fine){
  .dsm-wb-side-context input:not(:disabled):hover+span{border-color:var(--wb-hairline-strong);color:var(--wb-text-2)}
}

.dsm-wb-side-model-use{
  appearance:none;flex:none;margin:0;padding:0 9px;height:22px;
  border:1px solid var(--wb-hairline-strong);border-radius:7px;background:var(--wb-surface-1);
  color:var(--wb-text-2);font:inherit;font-size:11px;font-weight:500;line-height:20px;cursor:pointer;
  transition:background-color 150ms ease,color 150ms ease,border-color 150ms ease,transform 160ms var(--wb-ease-out);
}
.dsm-wb-side-model-use:active:not(:disabled){transform:scale(.95)}
.dsm-wb-side-model-use:disabled{cursor:default}
.dsm-wb-side-model-use-on{background:transparent;border-color:transparent;color:var(--wb-accent)}

.dsm-wb-side-empty{color:var(--wb-text-3);font-size:12px;line-height:18px}
.dsm-wb-side-error{
  flex:none;padding:8px 10px;border-radius:9px;
  border:1px solid rgba(239,68,68,.22);background:rgba(239,68,68,.10);
  color:var(--dsw-alias-state-error-primary,#f87171);font-size:11.5px;line-height:17px;word-break:break-word;
}

/* ---------- hover (gated: touch fires false hovers on tap) ---------- */
@media (hover:hover) and (pointer:fine){
  .dsm-wb-side-trigger:hover{background:var(--wb-surface-2);color:var(--wb-text)}
  .dsm-wb-side-collapse:hover{background:var(--wb-surface-2);color:var(--wb-text)}
  .dsm-wb-side-model:hover{background:var(--wb-surface-1)}
  .dsm-wb-side-panel .dsm-btn-primary:hover:not(:disabled){
    background:linear-gradient(180deg,rgba(91,140,255,.30),rgba(91,140,255,.20));color:#fff;
  }
  .dsm-wb-side-panel .dsm-btn-outline:hover:not(:disabled){
    background:var(--wb-surface-2);border-color:var(--wb-hairline-strong);color:var(--wb-text);
  }
  .dsm-wb-side-panel .dsm-workbuddy-tab:hover{color:var(--wb-text-2)}
  .dsm-wb-side-model-use:hover:not(:disabled){background:var(--wb-surface-2);color:var(--wb-text)}
}

/* ---------- reduced motion: gentler, not zero ---------- */
@media (prefers-reduced-motion:reduce){
  .dsm-wb-side-panel{transition:opacity 150ms ease}
  @starting-style{
    .dsm-wb-side-panel{transform:none;opacity:0}
  }
  .dsm-wb-side-trigger:active,
  .dsm-wb-side-chevron,
  .dsm-wb-side-panel .dsm-btn:active:not(:disabled),
  .dsm-wb-side-model-enabled input:active:not(:disabled),
  .dsm-wb-side-model-use:active:not(:disabled),
  .dsm-wb-side-collapse:active{transform:none}
  .dsm-wb-side-model-enabled input::after,
  .dsm-wb-side-model-image input::after{transition:opacity 150ms ease}
  .dsm-wb-side-model-image input:checked::after{transform:translateX(12px)}
}

/* ---------- account pool ---------- */
.dsm-wb-side-count{padding:0 6px;border-radius:999px;background:var(--wb-surface-2);color:var(--wb-text-2);font-size:10.5px;font-weight:600;letter-spacing:.01em;font-variant-numeric:tabular-nums}
.dsm-wb-side-pool-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.dsm-wb-side-pool-stat{
  display:flex;flex-direction:column;gap:1px;min-width:0;padding:6px 8px;
  border:1px solid var(--wb-hairline);border-radius:8px;background:var(--wb-surface-1);
}
.dsm-wb-side-pool-stat span{color:var(--wb-text-3);font-size:10px;line-height:13px}
.dsm-wb-side-pool-stat strong{color:var(--wb-text);font-size:16px;line-height:20px;font-weight:600;font-variant-numeric:tabular-nums}
.dsm-wb-side-pool-stat-credits{
  grid-column:1 / -1;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;
}
.dsm-wb-side-pool-stat-credits strong{font-size:13px;line-height:18px}
/* The pool's own readout - a card of its own, built like the summary tiles
   above it so the two read as one family. auto-fit keeps four columns while
   they fit and folds to fewer when the card is narrow; the figures never
   scroll sideways. */
.dsm-wb-side-pool-metrics{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(76px,1fr));gap:4px 10px;
  padding:7px 9px;border:1px solid var(--wb-hairline);border-radius:8px;background:var(--wb-surface-1);
  color:var(--wb-text-3);font-size:10px;line-height:13px;font-variant-numeric:tabular-nums;
}
/* flex:none keeps a long figure from being squeezed into its neighbour: the
   grid folds to another row instead of compressing a value. */
.dsm-wb-side-pool-metric{flex:none;display:flex;flex-direction:column;gap:1px;min-width:0;white-space:nowrap}
.dsm-wb-side-pool-metric strong{color:var(--wb-text);font-size:13px;line-height:17px;font-weight:600}
.dsm-wb-side-accounts{display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-x:hidden;overflow-y:auto;margin:0 -4px;padding:0 4px}
/* One row per account. The row is a container - the pick button and that
   account's own check-in control are siblings inside it - so a row can carry
   controls without nesting a button inside a button. */
.dsm-wb-side-acct{
  position:relative;display:flex;align-items:center;gap:6px 8px;flex-wrap:wrap;width:100%;
  box-sizing:border-box;
  padding:6px 8px;border:1px solid var(--wb-hairline);border-radius:9px;background:var(--wb-surface-1);
  color:var(--wb-text-2);
  transition:background-color 150ms ease,border-color 150ms ease,color 150ms ease;
}
/* the control cluster keeps to one line, and drops below the name when narrow */
.dsm-wb-side-acct-side{flex:none;display:flex;align-items:center;gap:6px;margin-left:auto}
.dsm-wb-side-acct-on{background:linear-gradient(180deg,rgba(91,140,255,.14),rgba(91,140,255,.07));border-color:rgba(91,140,255,.30);color:var(--wb-text)}
/* Cooling is a state the row must show at a glance, not only in a tooltip. */
.dsm-wb-side-acct-cool{border-color:rgba(245,158,11,.30)}
.dsm-wb-side-acct-pick{
  appearance:none;flex:1 1 150px;min-width:0;display:flex;align-items:center;gap:8px;
  margin:0;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;
  transition:transform 160ms var(--wb-ease-out),opacity 150ms ease;
}
.dsm-wb-side-acct-pick:active:not(:disabled){transform:scale(.98)}
.dsm-wb-side-acct-pick:disabled{opacity:.5;cursor:default}
.dsm-wb-side-acct-mark{flex:none;display:grid;place-items:center;width:14px;height:14px;color:var(--wb-accent);font-size:11px;line-height:14px}
.dsm-wb-side-acct-copy{display:flex;flex-direction:column;justify-content:center;gap:1px;min-width:0;flex:1}
.dsm-wb-side-acct-name{color:var(--wb-text);font-size:12.5px;font-weight:500;line-height:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-wb-side-acct-meta{color:var(--wb-text-3);font-size:10.5px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-wb-side-acct-metrics{
  display:flex;flex-wrap:wrap;gap:1px 8px;color:var(--wb-text-3);
  font-size:10.5px;line-height:14px;font-variant-numeric:tabular-nums;
}
/* Deadline, not a countdown: it stays true while the panel sits open. */
.dsm-wb-side-acct-cooling{
  color:var(--dsw-alias-state-warning-primary,#f59e0b);font-size:10.5px;line-height:14px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsm-wb-side-status{
  flex:none;padding:1px 7px;border-radius:999px;background:var(--wb-surface-2);color:var(--wb-text-3);
  font-size:10.5px;line-height:16px;font-weight:500;white-space:nowrap;
}
.dsm-wb-side-status-cool{background:rgba(245,158,11,.14);color:var(--dsw-alias-state-warning-primary,#f59e0b)}
.dsm-wb-side-status-model{background:rgba(245,158,11,.10);color:var(--dsw-alias-state-warning-primary,#f59e0b)}
.dsm-wb-side-status-live{background:rgba(91,140,255,.14);color:var(--wb-accent)}
.dsm-wb-side-panel .dsm-wb-side-acct-check{flex:none;height:24px;padding:0 8px;font-size:11px;line-height:22px;border-radius:7px}

/* ---------- credit package composition ---------- */
/* The switch sits ABOVE the two-column page grid, in its own flex column, so it
   cannot fight the grid rows the pool already owns. The surface slots dissolve
   so each surface keeps its original placement inside the grid. */
.dsm-wb-side-main{display:flex;flex-direction:column;gap:12px;min-width:0}
.dsm-wb-view-panel .dsm-wb-side-group-surfaces{border:0;padding:0}
.dsm-wb-view-panel .dsm-wb-side-body-pool-slot,
.dsm-wb-view-panel .dsm-wb-side-body-usage-slot{display:contents}
/* ---------- usage readout ---------- */
.dsm-wb-side-usage-totals{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:6px;
}
/* Range chips sit in the same segmented-control family as the provider tabs,
   but compact: six controls on one line would truncate at 13px. */
.dsm-wb-side-usage-ranges{gap:4px;padding:3px;border-radius:9px;flex-wrap:wrap}
/* flex:none so a chip is never squeezed into an ellipsis when the row is tight;
   the control wraps to a second line instead */
.dsm-wb-side-usage-ranges .dsm-workbuddy-tab{flex:none;padding:4px 8px;font-size:11px;line-height:15px;border-radius:7px;white-space:nowrap}
.dsm-wb-side-usage-ranges .dsm-btn{flex:none;height:24px;padding:0 8px;font-size:11px;line-height:22px;border-radius:7px}
/* the usage surface is its own page: the pool's continuous backdrop would show
   as an empty card behind it */
.dsm-wb-view-panel .dsm-wb-side-body-usage::before{display:none}
.dsm-wb-side-usage-total{
  display:flex;flex-direction:column;gap:1px;min-width:0;padding:8px 10px;
  border:1px solid var(--wb-hairline);border-radius:8px;background:var(--wb-surface-1);
}
.dsm-wb-side-usage-total strong{color:var(--wb-text);font-size:17px;line-height:21px;font-weight:600;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}
.dsm-wb-side-usage-total span{color:var(--wb-text-3);font-size:10px;line-height:13px;white-space:nowrap}
.dsm-wb-side-usage-total-warn strong{color:var(--dsw-alias-state-warning-primary,#f59e0b)}
.dsm-wb-side-chart{
  border:1px solid var(--wb-hairline);border-radius:8px;background:var(--wb-surface-1);padding:8px 10px 6px;
}
.dsm-wb-side-chart-legend{display:flex;gap:10px;margin-bottom:6px;color:var(--wb-text-3);font-size:10px}
.dsm-wb-side-chart-prompt::before,
.dsm-wb-side-chart-completion::before{content:"";display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:4px}
.dsm-wb-side-chart-prompt::before{background:#5b8cff}
.dsm-wb-side-chart-completion::before{background:#34d399}
/* Y-axis ticks on the left, plot to the right, x labels under the plot. */
.dsm-wb-side-chart-plot{
  display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:104px auto;
  column-gap:8px;row-gap:5px;align-items:stretch;
}
.dsm-wb-side-chart-axis{
  display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;
  color:var(--wb-text-3);font-size:10px;line-height:12px;font-variant-numeric:tabular-nums;
}
/* the grid is the positioning context: one hairline per tick, 0 at the bottom */
.dsm-wb-side-chart-area{position:relative;min-width:0}
.dsm-wb-side-chart-grid{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between}
.dsm-wb-side-chart-grid span{display:block;height:1px;background:var(--wb-hairline)}
.dsm-wb-side-chart-cols{
  position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:space-around;
  gap:4px;padding:0 6px;
}
/* A dense window (14 days = up to 336 hourly buckets) cannot afford a 4px gap
   per column: the gaps alone would exceed the panel width and push the whole
   page sideways. Collapse the gap and let columns shrink to a hairline. */
.dsm-wb-side-chart-cols-dense{gap:1px;padding:0 3px}
.dsm-wb-side-chart-cols-dense .dsm-wb-side-chart-slot{flex:1 1 0;min-width:1px}
.dsm-wb-side-chart-xaxis span:empty{visibility:hidden}
/* fixed, narrow columns with real gaps: a sparse window must look sparse, not
   like one solid block of colour stretching the full width */
.dsm-wb-side-chart-slot{flex:0 1 34px;min-width:4px;height:100%;display:flex;align-items:flex-end}
.dsm-wb-side-chart-bar{
  /* NO min-height: the height is owned by the component, which sets 0 for a
     zero-token bucket. A CSS floor here drew a 2px stub on empty hours that read
     as real traffic. Real bars are already floored in JS so none is invisible. */
  position:relative;width:100%;border-radius:2px 2px 0 0;overflow:hidden;
  display:flex;flex-direction:column;
}
.dsm-wb-side-chart-seg{display:block;width:100%}
.dsm-wb-side-chart-seg-completion{background:#34d399}
.dsm-wb-side-chart-seg-prompt{background:#5b8cff}
.dsm-wb-side-chart-xaxis{
  grid-column:2;display:flex;justify-content:space-around;gap:4px;padding:0 6px;
  color:var(--wb-text-3);font-size:9.5px;line-height:12px;
}
.dsm-wb-side-chart-xaxis span{flex:0 1 34px;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsm-wb-side-usage-tablewrap{overflow-x:auto;margin:0 -2px}
.dsm-wb-side-usage-table{
  width:100%;border-collapse:collapse;color:var(--wb-text-2);
  font-size:10.5px;line-height:15px;font-variant-numeric:tabular-nums;
}
.dsm-wb-side-usage-table th{
  padding:4px 6px;color:var(--wb-text-3);font-size:10px;font-weight:500;text-align:right;white-space:nowrap;
  border-bottom:1px solid var(--wb-hairline);
}
.dsm-wb-side-usage-table th:first-child{text-align:left}
.dsm-wb-side-usage-table td{padding:5px 6px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--wb-hairline)}
.dsm-wb-side-usage-table tbody tr:last-child td{border-bottom:0}
.dsm-wb-side-usage-table td:first-child{text-align:left;max-width:190px;overflow:hidden;text-overflow:ellipsis}
.dsm-wb-side-usage-name{color:var(--wb-text)}
.dsm-wb-side-usage-warn{color:var(--dsw-alias-state-warning-primary,#f59e0b)}
/* Higher specificity than the generic .dsm-wb-side-col rule: the usage page is
   one vertical column, not the pool's two-column split. */
.dsm-wb-view-panel .dsm-wb-side-body-usage-slot .dsm-wb-side-col-usage{
  grid-column:1 / -1;display:flex;flex-direction:column;gap:12px;min-width:0;
}
@container wb-view (max-width:760px){
  .dsm-wb-view-panel .dsm-wb-side-col-usage{grid-column:1}
}
.dsm-wb-side-packages{border-top:1px solid var(--wb-hairline);padding-top:8px}
.dsm-wb-side-packages summary{
  display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:22px;
  color:var(--wb-text-2);font-size:11px;font-weight:500;cursor:pointer;list-style:none;
}
.dsm-wb-side-packages summary::-webkit-details-marker{display:none}
.dsm-wb-side-packages summary::after{content:"›";color:var(--wb-text-3);transition:transform 160ms var(--wb-ease-out)}
.dsm-wb-side-packages[open] summary::after{transform:rotate(90deg)}
.dsm-wb-side-packages-count{
  margin-left:auto;padding:0 6px;border-radius:999px;background:var(--wb-surface-2);
  color:var(--wb-text-3);font-size:10px;font-weight:600;font-variant-numeric:tabular-nums;
}
.dsm-wb-side-packages-list{display:flex;flex-direction:column;max-height:156px;overflow-x:hidden;overflow-y:auto;margin-top:2px}
.dsm-wb-side-package{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;padding:6px 0;border-top:1px solid var(--wb-hairline)}
.dsm-wb-side-package-copy{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.dsm-wb-side-package-name{color:var(--wb-text-2);font-size:11px;line-height:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsm-wb-side-package-date{color:var(--wb-text-3);font-size:10px;line-height:13px}
.dsm-wb-side-package-amount{flex:none;color:var(--wb-text);font-size:11px;line-height:15px;font-weight:600;font-variant-numeric:tabular-nums}

@media (hover:hover) and (pointer:fine){
  .dsm-wb-side-acct:hover{background:var(--wb-surface-2);border-color:var(--wb-hairline-strong);color:var(--wb-text)}
}
@media (prefers-reduced-motion:reduce){
  .dsm-wb-side-acct-pick:active:not(:disabled){transform:none}
}

/* ---------- add account ---------- */
.dsm-wb-side-actions{display:flex;align-items:center;gap:8px;flex:none}
.dsm-wb-side-add{color:var(--wb-text);border-color:rgba(91,140,255,.32);background:linear-gradient(180deg,rgba(91,140,255,.18),rgba(91,140,255,.10))}
.dsm-wb-side-addform{display:flex;flex-direction:column;gap:8px;padding:9px;border:1px solid var(--wb-hairline);border-radius:10px;background:var(--wb-surface-1)}
.dsm-wb-side-addhint{color:var(--wb-text-3);font-size:10.5px;line-height:14px}
.dsm-wb-side-addrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.dsm-wb-side-addrow .dsm-btn{flex:1 1 auto;min-width:0}
/* the device-authorization link: readable, selectable, and never a layout risk */
.dsm-wb-side-addlink{display:flex;flex-direction:column;gap:8px}
.dsm-wb-side-addurl{
  display:block;max-height:52px;overflow-x:hidden;overflow-y:auto;padding:6px 8px;
  border:1px solid var(--wb-hairline);border-radius:8px;background:var(--wb-surface-2);
  color:var(--wb-text-2);font-size:10.5px;line-height:14px;word-break:break-all;user-select:all;
}
.dsm-wb-side-addstatus{color:var(--wb-text-3);font-size:10.5px;line-height:14px}
.dsm-wb-side-addstatus-on{color:var(--dsw-alias-state-success-primary,#22c55e)}
.dsm-wb-side-adderr{color:var(--dsw-alias-state-error-primary,#ef4444);font-size:10.5px;line-height:14px}
@media (hover:hover) and (pointer:fine){
  .dsm-wb-side-add:hover:not(:disabled){border-color:rgba(91,140,255,.5);background:linear-gradient(180deg,rgba(91,140,255,.24),rgba(91,140,255,.14))}
}

/* pool row credits: a flex item now that the row carries other controls */
.dsm-wb-side-acct-credits{
  flex:none;
  padding:1px 7px;border-radius:999px;background:var(--wb-surface-2);color:var(--wb-text-2);
  font-size:11px;font-weight:500;line-height:16px;font-variant-numeric:tabular-nums;
  white-space:nowrap;
}
/* name-visibility switch (same drawn control as the multimodal switch) */
.dsm-wb-switch{display:inline-flex;align-items:center;gap:6px;flex:none;margin:0;cursor:pointer;color:var(--wb-text-3);font-size:11px;line-height:16px}
.dsm-wb-switch input{
  appearance:none;position:relative;flex:none;width:28px;height:16px;margin:0;border-radius:999px;
  cursor:pointer;background:var(--wb-surface-3);border:1px solid var(--wb-hairline);
  transition:background-color 180ms var(--wb-ease-out),border-color 180ms var(--wb-ease-out);
}
.dsm-wb-switch input::after{
  content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;
  background:#fff;opacity:.8;
  transition:transform 180ms var(--wb-ease-out),opacity 180ms var(--wb-ease-out);
}
.dsm-wb-switch input:checked{background:var(--wb-accent);border-color:var(--wb-accent)}
.dsm-wb-switch input:checked::after{transform:translateX(12px);opacity:1}
.dsm-wb-switch input:focus-visible{outline:2px solid var(--wb-accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){
  .dsm-wb-switch input::after{transition:opacity 150ms ease}
  .dsm-wb-switch input:checked::after{transform:translateX(12px)}
}

/* ---------- main-area view (the third header tab) ---------- */
.dsm-wb-view-root{
  display:flex;flex-direction:column;width:100%;height:100%;min-height:0;box-sizing:border-box;
  padding:14px 18px var(--wb-view-clearance);overflow:auto;
  container-name:wb-view;container-type:inline-size;
}
/* flex:0 0 auto: the panel keeps its natural height so the root scrolls once the
   content is taller than the visible area. Shrinking it instead let content
   overflow the panel invisibly - the card bottom ended up tucked under the
   composer with no way to scroll it clear. */
.dsm-wb-view-panel{
  position:static;left:auto;top:auto;bottom:auto;
  width:100%;max-width:none;max-height:none;height:auto;min-height:0;
  flex:0 0 auto;border:0;border-radius:0;box-shadow:none;background:transparent;
  transform:none;opacity:1;overflow:visible;
}
.dsm-wb-view-panel::after{display:none}
.dsm-wb-view-panel .dsm-wb-side-head{display:none}
.dsm-wb-view-panel .dsm-wb-side-body{
  position:relative;display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);
  grid-template-rows:min-content min-content min-content;
  column-gap:14px;row-gap:0;align-items:start;width:100%;max-width:1040px;margin:0 auto;
  padding:0;overflow:visible;
}
/* Keeping the old column wrappers in the DOM preserves the popover, but in the
   tab their children participate directly in the two-column page grid. */
.dsm-wb-view-panel .dsm-wb-side-col{
  display:contents;
}
/* One continuous account surface behind provider + credits + pool, stacked
   downward in the order the controls are actually used. */
.dsm-wb-view-panel .dsm-wb-side-body::before{
  content:"";grid-column:1;grid-row:1 / 4;align-self:stretch;pointer-events:none;z-index:0;
  border:1px solid var(--wb-hairline);border-radius:12px;background:var(--wb-surface-1);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 18px 44px -36px rgba(0,0,0,.72);
}
.dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-provider{
  grid-column:1;grid-row:1;position:relative;z-index:1;align-self:stretch;
  padding:14px;border:0;border-radius:0;background:transparent;
}
.dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-credits{
  grid-column:1;grid-row:2;position:relative;z-index:1;align-self:stretch;
  padding:12px 14px 14px;border:0;border-top:1px solid var(--wb-hairline);border-radius:0;background:transparent;
}
.dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-pool{
  grid-column:1;grid-row:3;position:relative;z-index:1;align-self:stretch;
  padding:12px 14px 14px;border:0;border-top:1px solid var(--wb-hairline);border-radius:0;background:transparent;
}
.dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-models{
  position:absolute;top:0;right:0;width:calc(54% - 7px);min-width:0;
}
.dsm-wb-view-panel .dsm-wb-side-group-models .dsm-wb-side-models{
  max-height:min(54vh,540px);overflow-y:auto;
}
.dsm-wb-view-panel .dsm-wb-side-group{
  box-sizing:border-box;border:1px solid var(--wb-hairline);border-radius:12px;padding:14px;background:var(--wb-surface-1);
}
.dsm-wb-view-panel .dsm-wb-side-group+.dsm-wb-side-group{padding-top:14px}
/* Both scrolling lists stay bounded in the tab: leaving them unbound let a long
   model list stretch its grid row until the rows ran under the composer. */
.dsm-wb-view-panel .dsm-wb-side-models{max-height:min(46vh,460px)}
.dsm-wb-view-panel .dsm-wb-side-accounts{max-height:min(32vh,320px)}
.dsm-wb-view-panel .dsm-wb-side-tabs{max-width:none}

/* On a genuinely narrow content area, stack the page and cap the width so the
   model card stays a card instead of becoming a full-width mobile sheet. */
@container wb-view (max-width:760px){
  .dsm-wb-view-panel .dsm-wb-side-body{
    grid-template-columns:minmax(0,1fr);grid-template-rows:min-content min-content min-content auto;
    column-gap:0;row-gap:0;max-width:680px;
  }
  .dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-provider{
    grid-column:1;grid-row:2;
  }
  .dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-credits{
    grid-column:1;grid-row:3;
  }
  .dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-pool{
    grid-column:1;grid-row:4;
  }
  .dsm-wb-view-panel .dsm-wb-side-group.dsm-wb-side-group-models{
    position:static;grid-column:1;grid-row:4;width:auto;max-width:100%;margin-top:14px;
  }
}

/* ---------- provider row: one line, not a card-sized block ---------- */
.dsm-wb-side-group-provider .dsm-wb-side-row{gap:8px}
.dsm-wb-side-tabs-inline{flex:1;min-width:0}

/* Model capability details stay with their model row and wrap instead of clipping. */
.dsm-wb-side-model-meta{
  display:block;padding-left:27px;color:var(--wb-text-3);font-size:10.5px;line-height:16px;
  letter-spacing:.01em;white-space:normal;overflow-wrap:anywhere;
}
.dsm-wb-side-model-meta span+span::before{content:"·";margin:0 6px;color:var(--wb-text-3)}
.dsm-wb-side-model-meta .dsm-wb-side-model-limit-time{color:var(--dsw-alias-state-warning-primary,#f59e0b)}
`;
		//#endregion
		//#region src/client/WorkBuddyCard.tsx
		/**
		* WorkBuddy credits & models card contributed to Harness Plugin configuration.
		*
		* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
		*   — 卡片的整体结构（折叠外壳 / 账号状态行 / 账号下拉 / 积分区 / 模型表 /
		*     操作按钮行）、模块加载时注入一次 `<style>` 的写法、
		*     草稿态（draftModels/draftEnabledIds）与 dirty 标记的保存流程、
		*     60 秒轮询与 AbortController 清理、以及
		*     `IconChevronDownOutline14` 的使用，均来自该项目的 TraeUsageCard。
		*   折叠卡片外壳与 `settings.plugin.item` 槽位形态来自
		*   dingminhua/dsh-subagent-default-model（MIT）。
		* 改动：
		*   1. 积分区改为「合计 + 按套餐名聚合的进度条」，因为实测单个账号下
		*      同名套餐可达 19 个，逐条渲染会淹没卡片（原项目按上游条目直出）；
		*   2. 模型行补上 WorkBuddy 上游给出的积分倍率、多模态与推理档位；
		*   3. 移除与 WorkBuddy 上游无关的 1M 变体勾选；
		*   4. 双 provider 化后卡片顶部为「国内版 / 国际版」tab 栏 —— 每个 tab
		*      是一个独立供应商（workbuddy / workbuddy-global），账号、积分、
		*      模型目录与草稿完全按区域隔离，切 tab 不丢另一侧未保存的草稿。
		*
		* @module dsh-connect-workbuddy/client/WorkBuddyCard
		*/
		const POLL_INTERVAL_MS = 6e4;
		const WORKBUDDY_GITHUB_URL = "https://github.com/dingminhua/dsh-connect-workbuddy";
		/** Inject or refresh the shared card CSS for the current client bundle. */
		if (typeof document !== "undefined") {
			const cssId = "dsh-connect-workbuddy/client.css";
			const existing = document.querySelector(`style[data-plugin-css="${cssId}"]`);
			if (existing !== null) existing.textContent = WORKBUDDY_CARD_CSS;
			else {
				const styleTag = document.createElement("style");
				styleTag.dataset.plugin = "dsh-connect-workbuddy";
				styleTag.dataset.pluginCss = cssId;
				styleTag.textContent = WORKBUDDY_CARD_CSS;
				document.head.appendChild(styleTag);
			}
		}
		function formatNumber(value) {
			return new Intl.NumberFormat(void 0, {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			}).format(value);
		}
		function formatDateTime(value) {
			return new Intl.DateTimeFormat(void 0, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			}).format(new Date(value));
		}
		/** Compact package-date rendering with time, e.g. 08/25 14:44. */
		function formatDate(value) {
			return new Intl.DateTimeFormat(void 0, {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			}).format(new Date(value));
		}
		function formatCapacity(value, unknown) {
			if (value === void 0) return unknown;
			if (value >= 1e6 && value % 1e6 === 0) return `${value / 1e6}M`;
			if (value >= 1e3 && value % 1e3 === 0) return `${value / 1e3}K`;
			return formatNumber(value);
		}
		function dotStyle(status) {
			return { background: status === "signed-in" ? "var(--dsw-alias-state-success-primary, #22a06b)" : status === "error" ? "var(--dsw-alias-state-error-primary, #d92d20)" : "var(--dsw-alias-label-dimmed, #9aa0a6)" };
		}
		/** Read the per-region account selections out of the settings snapshot. */
		function configuredAccountsOf(configured) {
			const accounts = configured?.accounts;
			return typeof accounts === "object" && accounts !== null ? accounts : {};
		}
		/** Render WorkBuddy sign-in state, credits, and model selection as one card. */
		function WorkBuddyCard({ t, settingsScope }) {
			if (t === void 0) throw new Error("WorkBuddy plugin card requires its translation function");
			const [open, setOpen] = (0, react.useState)(false);
			/** The region whose tab is on screen; each tab is its own provider stack. */
			const [activeRegion, setActiveRegion] = (0, react.useState)("cn");
			/** Last-known usage per region, so tab dots survive tab switches. */
			const [statusByRegion, setStatusByRegion] = (0, react.useState)({
				cn: {
					status: "signed-out",
					accounts: []
				},
				global: {
					status: "signed-out",
					accounts: []
				}
			});
			const [busy, setBusy] = (0, react.useState)(false);
			const [settingsRevision, setSettingsRevision] = (0, react.useState)(0);
			/** Per-region unsaved model edits; a draft on one tab is never dropped by
			* switching to the other tab, only by that tab's discard/save. */
			const [drafts, setDrafts] = (0, react.useState)({});
			const [saving, setSaving] = (0, react.useState)(false);
			/** Save failure surfaced next to the buttons; cleared by the next attempt. */
			const [saveError, setSaveError] = (0, react.useState)(void 0);
			const [switchingAccount, setSwitchingAccount] = (0, react.useState)(false);
			const [checkingIn, setCheckingIn] = (0, react.useState)(false);
			const [checkinActionError, setCheckinActionError] = (0, react.useState)(void 0);
			const mounted = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			(0, react.useEffect)(() => settingsScope?.subscribe(() => {
				setSettingsRevision((value) => value + 1);
			}), [settingsScope]);
			const refreshUsage = (0, react.useCallback)(async (region, signal) => {
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_USAGE_PATH, region), {
						headers: { accept: "application/json" },
						credentials: "same-origin",
						...signal === void 0 ? {} : { signal }
					});
					const value = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const usage = value;
					if (mounted.current && signal?.aborted !== true) setStatusByRegion((prev) => ({
						...prev,
						[region]: usage
					}));
					return usage;
				} catch (error) {
					if (mounted.current && signal?.aborted !== true) setStatusByRegion((prev) => ({
						...prev,
						[region]: {
							status: "error",
							message: error instanceof Error ? error.message : t("row.requestFailed")
						}
					}));
					return;
				}
			}, [t]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const controller = new AbortController();
				refreshUsage(activeRegion, controller.signal);
				return () => {
					controller.abort();
				};
			}, [
				open,
				activeRegion,
				refreshUsage
			]);
			const status = statusByRegion[activeRegion] ?? {
				status: "signed-out",
				accounts: []
			};
			(0, react.useEffect)(() => {
				if (!open || status.status !== "signed-in") return;
				const controller = new AbortController();
				const timer = window.setInterval(() => {
					refreshUsage(activeRegion, controller.signal);
				}, POLL_INTERVAL_MS);
				return () => {
					window.clearInterval(timer);
					controller.abort();
				};
			}, [
				open,
				activeRegion,
				refreshUsage,
				status.status
			]);
			const rescanAccounts = async () => {
				setBusy(true);
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_ACCOUNTS_REFRESH_PATH, activeRegion), {
						method: "POST",
						headers: { accept: "application/json" },
						credentials: "same-origin"
					});
					const body = await response.json();
					if (!response.ok || !Array.isArray(body.accounts)) throw new Error(`HTTP ${response.status}`);
					const selected = body.accounts.find((account) => account.selected)?.id;
					const configuredAccounts = configuredAccountsOf(settingsScope?.getSnapshot().value);
					const configuredId = configuredAccounts[activeRegion];
					if (selected !== void 0 && selected !== configuredId && settingsScope?.getSnapshot().writable === true) await settingsScope.set("accounts", {
						...configuredAccounts,
						[activeRegion]: selected
					});
					await refreshUsage(activeRegion);
				} finally {
					if (mounted.current) setBusy(false);
				}
			};
			const switchAccount = async (accountId) => {
				if (settingsScope === void 0) return;
				setSwitchingAccount(true);
				try {
					const configuredAccounts = configuredAccountsOf(settingsScope.getSnapshot().value);
					await settingsScope.set("accounts", {
						...configuredAccounts,
						[activeRegion]: accountId
					});
					await refreshUsage(activeRegion);
				} finally {
					if (mounted.current) setSwitchingAccount(false);
				}
			};
			const claimDailyCheckin = async () => {
				setCheckingIn(true);
				setCheckinActionError(void 0);
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_CHECKIN_PATH, activeRegion), {
						method: "POST",
						headers: { accept: "application/json" },
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					await refreshUsage(activeRegion);
				} catch (error) {
					if (mounted.current) setCheckinActionError(error instanceof Error ? error.message : t("row.requestFailed"));
				} finally {
					if (mounted.current) setCheckingIn(false);
				}
			};
			const refreshModels = async () => {
				setBusy(true);
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_MODELS_REFRESH_PATH, activeRegion), {
						method: "POST",
						headers: { accept: "application/json" },
						credentials: "same-origin"
					});
					const body = await response.json();
					if (!response.ok || !Array.isArray(body.models)) throw new Error(`HTTP ${response.status}`);
					const fresh = body.models;
					const freshIds = new Set(fresh.map((model) => model.id));
					const stillEnabled = [...activeEnabledIds].filter((id) => freshIds.has(id));
					const stillImages = [...activeImageIds].filter((id) => freshIds.has(id));
					const stillBudgets = {};
					for (const id of freshIds) {
						const budget = activeContextBudgets[id];
						if (typeof budget === "number") stillBudgets[id] = budget;
					}
					setDrafts((prev) => ({
						...prev,
						[activeRegion]: {
							models: fresh,
							enabledIds: new Set(stillEnabled),
							imageIds: new Set(stillImages),
							contextBudgets: stillBudgets
						}
					}));
				} catch (error) {
					if (mounted.current) setStatusByRegion((prev) => ({
						...prev,
						[activeRegion]: {
							status: "error",
							message: error instanceof Error ? error.message : t("row.requestFailed")
						}
					}));
				} finally {
					if (mounted.current) setBusy(false);
				}
			};
			const draft = drafts[activeRegion];
			const visibleModels = draft?.models ?? (status.status === "signed-in" ? status.models : []);
			const savedEnabledIds = status.status === "signed-in" ? new Set(status.enabledModelIds) : /* @__PURE__ */ new Set();
			const activeEnabledIds = draft?.enabledIds ?? savedEnabledIds;
			const savedImageIds = status.status === "signed-in" ? new Set(status.imageModelIds) : /* @__PURE__ */ new Set();
			const activeImageIds = draft?.imageIds ?? savedImageIds;
			const configured = settingsScope?.getSnapshot().value;
			const configuredRegion = status.status === "signed-in" ? configured?.regions?.[status.region] : void 0;
			const legacyContextBudgets = status.status === "signed-in" && status.region === "cn" ? configured?.contextBudgets : void 0;
			const savedContextBudgetsSource = configuredRegion?.contextBudgets ?? legacyContextBudgets;
			const savedContextBudgets = typeof savedContextBudgetsSource === "object" && savedContextBudgetsSource !== null ? savedContextBudgetsSource : {};
			const activeContextBudgets = draft?.contextBudgets ?? savedContextBudgets;
			const dirty = draft !== void 0;
			const editDraft = (edit) => {
				setDrafts((prev) => ({
					...prev,
					[activeRegion]: edit(prev[activeRegion] ?? {
						models: [...visibleModels],
						enabledIds: new Set(activeEnabledIds),
						imageIds: new Set(activeImageIds),
						contextBudgets: { ...activeContextBudgets }
					})
				}));
			};
			const toggleModel = (modelId) => {
				editDraft((current) => {
					const next = new Set(current.enabledIds);
					if (!next.delete(modelId)) next.add(modelId);
					return {
						...current,
						enabledIds: next
					};
				});
			};
			const toggleImage = (modelId) => {
				editDraft((current) => {
					const next = new Set(current.imageIds);
					if (!next.delete(modelId)) next.add(modelId);
					return {
						...current,
						imageIds: next
					};
				});
			};
			const setContextBudget = (modelId, budget) => {
				editDraft((current) => ({
					...current,
					contextBudgets: {
						...current.contextBudgets,
						[modelId]: budget
					}
				}));
			};
			const discardModels = () => {
				setDrafts((prev) => {
					const next = { ...prev };
					delete next[activeRegion];
					return next;
				});
			};
			const saveModels = async () => {
				if (settingsScope === void 0) return;
				if (status.status !== "signed-in") return;
				setSaving(true);
				setSaveError(void 0);
				try {
					const configuredRegions = configured?.regions;
					await settingsScope.set("regions", {
						...typeof configuredRegions === "object" && configuredRegions !== null ? configuredRegions : {},
						[status.region]: {
							lastCatalog: visibleModels.map(toPersistedWorkBuddyModel),
							enabledModelIds: [...activeEnabledIds],
							imageModelIds: [...activeImageIds],
							contextBudgets: activeContextBudgets
						}
					});
					discardModels();
					await refreshUsage(activeRegion);
				} catch (error) {
					if (mounted.current) setSaveError(error instanceof Error ? error.message : t("row.requestFailed"));
				} finally {
					if (mounted.current) setSaving(false);
				}
			};
			const title = t("row.title");
			const label = status.status === "signed-in" ? t("row.signedIn", { accountName: status.accountName }) : status.status === "error" ? t("row.requestFailed") : t("row.signedOut");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: `dsm-plugin-card${open ? " dsm-plugin-card-open" : ""}`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dsm-plugin-card-header",
					"aria-expanded": open,
					"aria-label": `${t(open ? "row.collapse" : "row.expand")}: ${title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							className: "dsm-plugin-card-icon",
							src: WORKBUDDY_PLUGIN_ICON,
							alt: ""
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsm-plugin-card-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsm-plugin-card-title",
								children: title
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsm-plugin-card-description",
								children: t("row.desc")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: `dsm-plugin-card-chevron${open ? " dsm-plugin-card-chevron-open" : ""}`,
							children: (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { size: 14 })
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-plugin-card-body",
					hidden: !open,
					children: open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-workbuddy-usage",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-workbuddy-tabs",
								role: "tablist",
								"aria-label": title,
								children: WORKBUDDY_REGIONS.map((region) => {
									const regionStatus = statusByRegion[region];
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "tab",
										"aria-selected": region === activeRegion,
										className: `dsm-workbuddy-tab${region === activeRegion ? " dsm-workbuddy-tab-active" : ""}`,
										onClick: () => {
											setActiveRegion(region);
										},
										children: [regionStatus === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											className: "dsm-workbuddy-tab-dot",
											style: dotStyle(regionStatus.status)
										}), region === "cn" ? t("row.tabCn") : t("row.tabGlobal")]
									}, region);
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dsm-workbuddy-models-summary",
								children: t("row.tabHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-workbuddy-usage-account",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-workbuddy-usage-account-copy",
									role: "status",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-workbuddy-usage-status",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												className: "dsm-workbuddy-usage-dot",
												style: dotStyle(status.status)
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
										}),
										status.status === "signed-in" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-workbuddy-usage-expiry",
											children: t("row.tokenExpiry", { expiresAt: formatDateTime(status.tokenExpiresAtMs) })
										}) : null,
										status.status === "error" || status.status === "signed-in" && status.creditsError !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-workbuddy-usage-hint",
											children: t("row.reloginHint")
										}) : null
									]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsm-btn dsm-btn-outline",
									disabled: busy,
									onClick: () => {
										rescanAccounts();
									},
									children: busy ? t("row.accountsScanning") : t("row.accountsRescan")
								})]
							}),
							status.status !== "error" && status.accounts.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
								className: "dsm-workbuddy-account-picker",
								"aria-label": t("row.accountsTitle"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsm-workbuddy-usage-select-wrap",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										className: "dsm-workbuddy-usage-select",
										value: status.status === "signed-in" ? status.accountId : "",
										disabled: switchingAccount || settingsScope?.getSnapshot().writable !== true,
										onChange: (event) => {
											switchAccount(event.currentTarget.value);
										},
										children: status.accounts.map((account) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: account.id,
											children: [account.accountName, account.domain === "" ? "" : ` · ${account.domain}`]
										}, account.id))
									})
								})
							}) : null,
							status.status === "signed-in" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								status.credits === void 0 ? null : (() => {
									const monthly = [...status.credits.packages].filter((pack) => pack.monthly).sort((left, right) => right.remain - left.remain);
									const SOON_MS = 2592e5;
									const now = Date.now();
									const expiring = [...status.credits.packages].filter((pack) => !pack.monthly && pack.remain > 0 && (pack.expiresAtMs ?? Number.MAX_SAFE_INTEGER) - now <= SOON_MS).sort((left, right) => (left.expiresAtMs ?? Number.MAX_SAFE_INTEGER) - (right.expiresAtMs ?? Number.MAX_SAFE_INTEGER));
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsm-workbuddy-credits-panels",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: "dsm-workbuddy-credit-panel dsm-workbuddy-credit-panel-activities",
											children: [
												monthly.map((pack, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-workbuddy-credit-monthly-row",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsm-workbuddy-credit-monthly-name",
														children: pack.packageName
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsm-workbuddy-credit-monthly-meta",
														children: t("row.creditsMonthlyRemain", {
															remain: formatNumber(pack.remain),
															size: formatNumber(pack.size),
															at: pack.cycleRefreshMs === void 0 ? "" : formatDate(pack.cycleRefreshMs)
														})
													})]
												}, `monthly-${pack.packageName}-${String(index)}`)),
												expiring.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-workbuddy-credit-panel-empty",
													children: t("row.creditsNoSoon")
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
													className: "dsm-workbuddy-credit-packages",
													children: expiring.map((pack, index) => {
														const at = pack.expiresAtMs;
														return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: pack.packageName }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [formatNumber(pack.remain), at === void 0 ? "" : ` · ${formatDate(at)}`] })] }, `${pack.packageName}-${String(index)}`);
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-workbuddy-credit-soon",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("row.creditsExpiringSoon") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: formatNumber(status.credits.expiringSoon) })]
												})
											]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: "dsm-workbuddy-credit-panel dsm-workbuddy-credit-panel-total",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-workbuddy-credit-total-body",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsm-workbuddy-credit-panel-title",
														children: t("row.creditsTotalLabel")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
														className: "dsm-workbuddy-credit-total-value",
														children: formatNumber(status.credits.total)
													})]
												}),
												status.checkin === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dsm-workbuddy-checkin",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: "dsm-btn dsm-btn-primary dsm-workbuddy-checkin-button",
														disabled: !status.checkin.active || status.checkin.todayCheckedIn || checkingIn,
														onClick: () => {
															claimDailyCheckin();
														},
														children: checkingIn ? t("row.checkinClaiming") : status.checkin.todayCheckedIn ? t("row.checkinClaimed") : status.checkin.claimButtonText ?? t("row.checkinClaim")
													})
												}),
												status.checkinError === void 0 && checkinActionError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-workbuddy-checkin-error",
													children: t("row.checkinError", { message: checkinActionError ?? status.checkinError ?? "" })
												})
											]
										})]
									});
								})(),
								status.creditsError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "dsm-workbuddy-usage-error",
									children: t("row.creditsError", { message: status.creditsError })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: "dsm-workbuddy-models",
									"aria-label": t("row.modelsTitle"),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-workbuddy-models-head",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
												className: "dsm-workbuddy-models-title",
												children: t("row.modelsTitle")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "dsm-workbuddy-models-summary",
												children: t("row.modelsSummary", { count: activeEnabledIds.size })
											})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dsm-btn dsm-btn-outline",
												disabled: busy,
												onClick: () => {
													refreshModels();
												},
												children: busy ? t("row.modelsRefreshing") : t("row.modelsRefresh")
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dsm-workbuddy-model-list",
											children: visibleModels.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: `dsm-workbuddy-model${activeEnabledIds.has(model.id) ? "" : " dsm-workbuddy-model-disabled"}`,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-workbuddy-model-head",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dsm-workbuddy-model-enabled",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: activeEnabledIds.has(model.id),
																disabled: settingsScope?.getSnapshot().writable !== true || saving,
																onChange: () => {
																	toggleModel(model.id);
																}
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: "dsm-workbuddy-model-copy",
																children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																	className: "dsm-workbuddy-model-name",
																	children: [model.name, model.creditMultiplier === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																		className: "dsm-workbuddy-model-name-rate",
																		children: [
																			"(",
																			model.creditMultiplier.toFixed(2),
																			"x)"
																		]
																	})]
																})
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dsm-workbuddy-model-image",
															title: t("row.modelImage"),
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: activeImageIds.has(model.id),
																disabled: settingsScope?.getSnapshot().writable !== true || saving,
																onChange: () => {
																	toggleImage(model.id);
																}
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("row.modelImage") })]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
															className: "dsm-workbuddy-context-budget",
															"aria-label": t("row.contextBudget"),
															children: [model.nativeContextWindow > 2e5 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "radio",
																name: `context-${model.id}`,
																checked: (activeContextBudgets[model.id] ?? 2e5) === 2e5,
																disabled: settingsScope?.getSnapshot().writable !== true || saving,
																onChange: () => {
																	setContextBudget(model.id, 2e5);
																}
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "200K" })] }) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "radio",
																name: `context-${model.id}`,
																checked: model.nativeContextWindow <= 2e5 || activeContextBudgets[model.id] === model.nativeContextWindow,
																disabled: model.nativeContextWindow <= 2e5 || settingsScope?.getSnapshot().writable !== true || saving,
																onChange: () => {
																	setContextBudget(model.id, model.nativeContextWindow);
																}
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatCapacity(model.nativeContextWindow, t("row.modelUnknown")) })] })]
														})
													]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dsm-workbuddy-model-details",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "dsm-workbuddy-model-meta",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("row.modelContext", { context: formatCapacity(model.nativeContextWindow, t("row.modelUnknown")) }) }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("row.modelOutput", { output: formatCapacity(model.maxTokens, t("row.modelUnknown")) }) }),
															model.reasoning === void 0 || model.reasoning.supportedEfforts === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("row.modelReasoning", { efforts: model.reasoning.supportedEfforts.join(" / ") }) })
														]
													})
												})]
											}, model.id))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "dsm-workbuddy-model-capability-note",
											children: t("row.modelCapabilityPending")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-workbuddy-model-actions",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
													className: "dsm-workbuddy-usage-cheer",
													href: WORKBUDDY_GITHUB_URL,
													target: "_blank",
													rel: "noopener noreferrer",
													children: [t("row.cheer"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsm-workbuddy-usage-cheer-star",
														"aria-hidden": "true",
														children: "★"
													})]
												}),
												saveError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-workbuddy-model-save-error",
													children: t("row.saveError", { message: saveError })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-workbuddy-model-actions-buttons",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: "dsm-btn dsm-btn-outline",
														disabled: !dirty || saving,
														onClick: discardModels,
														children: t("row.discard")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: "dsm-btn dsm-btn-primary",
														disabled: !dirty || saving || activeEnabledIds.size === 0,
														onClick: () => {
															saveModels();
														},
														children: saving ? t("row.saving") : t("row.save")
													})]
												})
											]
										})
									]
								})
							] }) : null,
							status.status === "signed-out" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dsm-workbuddy-usage-text",
								children: status.message ?? t("row.signedOutHint")
							}) : null,
							status.status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dsm-workbuddy-usage-error",
								children: status.message
							}) : null
						]
					}) : null
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Plugin-card copy registered under the settings.workbuddy locale namespace.
		*
		* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
		*   — `row.*` 的文案键约定与中英 1:1 键对齐（`zh: Record<Key, string>`
		*     强制双语同步）来自该项目，其又继承自
		*     dingminhua/dsh-subagent-default-model（MIT）。
		* 改动：文案按 WorkBuddy 的实际情况改写（积分套餐、模型倍率、多账号）。
		*
		* @module dsh-connect-workbuddy/client/locales
		*/
		const en = {
			"row.title": "WorkBuddy credits & models (dsh-connect-workbuddy)",
			"row.desc": "Use WorkBuddy models in DSH and see your remaining credits; the domestic and international sides are two independent providers, each with its own account — use both at the same time.",
			"row.expand": "Expand",
			"row.collapse": "Collapse",
			"row.tabCn": "Domestic",
			"row.tabGlobal": "Global",
			"row.tabHint": "Each tab is a separate provider (workbuddy / workbuddy-global) with its own account, credits, and models. Both sides are live at once: different sessions can pick from either side, and changes on one tab never touch the other.",
			"row.signedOut": "Not signed in",
			"row.signedOutHint": "Sign in once in the WorkBuddy desktop app; this plugin follows that sign-in automatically.",
			"row.signedIn": "Signed in: {accountName}",
			"row.tokenExpiry": "Access token expires {expiresAt} (auto-renewal)",
			"row.reloginHint": "If errors occur, sign back in to the WorkBuddy app.",
			"row.requestFailed": "Request failed",
			"row.creditsTotalLabel": "Total remaining credits",
			"row.creditsMonthlyRemain": "Remaining {remain} / {size} · Refreshes {at}",
			"row.checkinClaim": "Check in",
			"row.checkinClaiming": "Checking in…",
			"row.checkinClaimed": "Checked in",
			"row.checkinError": "Check-in unavailable: {message}",
			"row.creditsError": "Credit query unavailable: {message}",
			"row.creditsNoSoon": "No packages expire within 3 days.",
			"row.creditsExpiringSoon": "Expiring in 3 days",
			"row.refresh": "Refresh",
			"row.refreshing": "Refreshing…",
			"row.accountsTitle": "WorkBuddy account",
			"row.accountsHint": "Choose from locally detected sign-ins. Tokens are never shown or saved in DSH settings.",
			"row.accountsRescan": "Detect accounts again",
			"row.accountsScanning": "Detecting…",
			"row.modelsTitle": "Models",
			"row.modelsSummary": "{count} enabled",
			"row.modelsRefresh": "Refresh from WorkBuddy",
			"row.modelsRefreshing": "Refreshing models…",
			"row.discard": "Discard changes",
			"row.save": "Save",
			"row.saving": "Saving…",
			"row.saveError": "Save failed: {message}",
			"row.modelContext": "Maximum context {context}",
			"row.contextBudget": "DSH context budget",
			"row.modelOutput": "Output {output}",
			"row.modelRate": "{rate}x credits",
			"row.modelMultimodal": "Multimodal",
			"row.modelImage": "Image",
			"row.modelReasoning": "Reasoning: {efforts}",
			"row.modelUnknown": "Unknown",
			"row.modelCapabilityPending": "Only capabilities advertised by WorkBuddy are shown.",
			"row.cheer": "Star on GitHub"
		};
		const zh = {
			"row.title": "接入使用 WorkBuddy 积分与模型（dsh-connect-workbuddy）",
			"row.desc": "在 DSH 中使用 WorkBuddy 模型并随时查看剩余积分；国内版与国际版是两个独立供应商，各有自己的账号，可同时使用。",
			"row.expand": "展开",
			"row.collapse": "收起",
			"row.tabCn": "国内版",
			"row.tabGlobal": "国际版",
			"row.tabHint": "每个 tab 是一个独立供应商（workbuddy / workbuddy-global），各有自己的账号、积分与模型。两边同时生效：不同会话可各选一边，一侧的改动不影响另一侧。",
			"row.signedOut": "未登录",
			"row.signedOutHint": "在 WorkBuddy 桌面 App 里登录一次即可，插件会自动跟随当前登录的账号。",
			"row.signedIn": "已登录：{accountName}",
			"row.tokenExpiry": "访问令牌 {expiresAt} 过期（自动续期）",
			"row.reloginHint": "出现错误，重新登录 WorkBuddy APP 即可。",
			"row.requestFailed": "请求失败",
			"row.creditsTotalLabel": "总剩余积分",
			"row.creditsMonthlyRemain": "剩余 {remain} / {size} · {at} 刷新",
			"row.checkinClaim": "立即签到",
			"row.checkinClaiming": "签到中…",
			"row.checkinClaimed": "今日已签到",
			"row.checkinError": "签到状态获取失败：{message}",
			"row.creditsError": "积分查询失败：{message}",
			"row.creditsNoSoon": "3 天内没有到期礼包。",
			"row.creditsExpiringSoon": "最近 3 天到期",
			"row.refresh": "刷新",
			"row.refreshing": "正在刷新…",
			"row.accountsTitle": "WorkBuddy 账号",
			"row.accountsHint": "选择本机检测到的登录账号；Token 不会显示，也不会保存到 DSH 设置。",
			"row.accountsRescan": "重新检测账号",
			"row.accountsScanning": "正在检测…",
			"row.modelsTitle": "模型",
			"row.modelsSummary": "已启用 {count} 个",
			"row.modelsRefresh": "从 WorkBuddy 刷新",
			"row.modelsRefreshing": "正在刷新模型…",
			"row.discard": "放弃修改",
			"row.save": "保存",
			"row.saving": "保存中…",
			"row.saveError": "保存失败：{message}",
			"row.modelContext": "最大上下文 {context}",
			"row.contextBudget": "DSH 上下文预算",
			"row.modelOutput": "最大输出 {output}",
			"row.modelRate": "积分 {rate}x",
			"row.modelMultimodal": "多模态",
			"row.modelImage": "图片",
			"row.modelReasoning": "推理强度：{efforts}",
			"row.modelUnknown": "未知",
			"row.modelCapabilityPending": "仅展示 WorkBuddy 接口明确公布的模型能力。",
			"row.cheer": "鼓励一下"
		};
		//#endregion
		//#region src/client/WorkBuddySidebar.tsx
		/**
		* Sidebar entry + panel for the WorkBuddy plugin.
		*
		* Mounted through ui-sidebar's own extension point: `sidebar.footer.action`
		* is a `kind:list` / `scope:root` slot whose owner share is `{ wide }` — the
		* same seat ui-cordis takes for its panel. The sidebar keeps owning the
		* button frame, the rail/wide geometry and the fade, so this occupant only
		* draws its own trigger and the panel it opens. Registering here adds one
		* entry to an existing list; no other sidebar plugin is displaced,
		* reordered, or made to share a seat.
		*
		* Data comes from the routes the settings card already uses (`usage` /
		* `accounts/refresh` / `models/refresh` / `checkin`). The model list and the
		* model switch use the platform's own session model directory
		* (`modelDirectories.directoryFor(sessionId)`), so a pick really installs the
		* session's model instead of faking a selection.
		*
		* @module dsh-connect-workbuddy/client/WorkBuddySidebar
		*/
		/** Panel copy (zh), kept beside the component so the panel is self-contained. */
		const WORKBUDDY_SIDEBAR_ZH = {
			entry: "WorkBuddy",
			entryTooltip: "WorkBuddy 积分与模型",
			title: "WorkBuddy",
			collapse: "收起",
			expand: "展开",
			region: "供应商",
			account: "账号",
			"sb-workbuddy-view": "WorkBuddy",
			rescan: "重新检测账号",
			rescanning: "检测中…",
			checkin: "签到",
			checkingIn: "签到中…",
			checkinDone: "今日已签到",
			checkinCredit: "签到积分",
			totalCredit: "总积分",
			refreshModels: "刷新模型",
			refreshing: "刷新中…",
			model: "选择模型",
			modelEmpty: "该供应商暂无模型",
			modelEnable: "启用并使用该模型",
			creditShort: "积分",
			creditUnknown: "—",
			pool: "号池",
			poolUnit: " 个账号",
			poolStatAccounts: "账号",
			poolStatAvailable: "可用",
			poolStatCooling: "冷却",
			poolStatCalls: "调用次数",
			poolStatFirstToken: "首 token",
			poolStatSpeed: "Token 速度",
			poolStatTokens: "Token 总量",
			tabPool: "账号池",
			tabUsage: "用量",
			/* Compact on purpose: four range chips plus the refresh button share one
			   row, and "近 14 天" truncates in the narrow sidebar. */
			usageRange1d: "1 天",
			usageRange3d: "3 天",
			usageRange7d: "7 天",
			usageRange14d: "14 天",
			usageRangeAll: "全部",
			usageRequests: "请求数",
			usageTotalTokens: "总 token",
			usagePrompt: "输入 token",
			usageCompletion: "输出 token",
			usageFailures: "失败尝试",
			usageAvgLatency: "平均延迟",
			usageAvgSpeed: "平均速率",
			usageTokensPerCredit: "token / 积分",
			usageCreditsSpent: "已耗积分",
			usageCacheHitRate: "缓存命中",
			usageByAccount: "按账号",
			usageByModel: "按模型",
			usageByRegion: "按域",
			usageColModel: "模型",
			usageColRealm: "域",
			usageColRequests: "请求",
			usageColPrompt: "输入",
			usageColCompletion: "输出",
			usageColFailures: "失败",
			usageColTotal: "合计",
			usageColLatency: "平均延迟",
			usageColSpeed: "平均速率",
			usageEmpty: "这个时间窗内还没有调用记录",
			usageRefresh: "刷新用量",
			poolPackages: "积分构成",
			packageCycle: "周期",
			packageExpires: "到期",
			modelDefault: "默认",
			modelEfforts: "档位",
			modelContext: "最大上下文",
			modelOutput: "最大输出",
			scan: "扫描添加账号",
			scanning: "扫描中",
			poolEmpty: "未发现账号：点「添加账号」生成登录链接，登录后自动入池",
			acctCurrent: "当前使用中",
			acctUse: "切换到这个账号",
			acctUnknown: "未命名账号",
			acctSuccess: "成功率",
			acctCalls: "次调用",
			acctLastSuccess: "最近成功",
			acctNoCalls: "暂无调用",
			acctInFlight: "在途",
			addAccount: "添加账号",
			poolCreditsLabel: "积分",
			refreshCredits: "刷新积分",
			refreshingCredits: "刷新中",
			hideNames: "隐藏账号名字",
			nameHidden: "已隐藏",
			creditsFailed: "积分刷新失败",
			addHint: "生成登录链接后在浏览器里登录要添加的账号，登录成功会自动收进号池。",
			addStart: "生成登录链接",
			addStarting: "生成中…",
			addWaiting: "等待浏览器完成登录…",
			addOpen: "打开登录页",
			addCopy: "复制链接",
			addCopied: "已复制",
			addCopyFailed: "复制失败，请手动选中链接",
			addDone: "已加入号池",
			addClose: "关闭",
			addCancel: "取消",
			addErrHttp: "添加失败",
			modelImage: "图片",
			contextBudget: "上下文",
			context200k: "200K",
			notWritable: "设置不可写，无法保存",
			modelEnabledHint: "已启用",
			modelUse: "使用",
			loading: "加载中…",
			noSession: "请先打开一个会话",
			noAccount: "未检测到账号",
			signedOut: "未登录",
			signedIn: "已登录",
			requestFailed: "请求失败",
			panelFailed: "面板渲染失败",
			poolHealthOk: "可用",
			poolHealthCooling: "冷却中",
			poolHealthModelLimited: "模型限流",
			coolingUntil: "冷却至",
			modelLimitUntil: "限流恢复时间",
			modelLimitHint: "该模型被上游限流，其它模型仍可使用",
			checkinAll: "一键签到",
			checkinAllBusy: "签到中…",
			checkinAllDone: "已全部签到",
			checkinOne: "签到",
			checkinOneDone: "已签到",
			checkinOneBusy: "签到中",
			coolingHint: "该账号被上游限流/额度耗尽，到期前自动换用其它账号"
		};
		/** English copy for the same keys. */
		const WORKBUDDY_SIDEBAR_EN = {
			entry: "WorkBuddy",
			entryTooltip: "WorkBuddy credits and models",
			title: "WorkBuddy",
			collapse: "Collapse",
			expand: "Expand",
			region: "Provider",
			account: "Account",
			"sb-workbuddy-view": "WorkBuddy",
			rescan: "Recheck account",
			rescanning: "Checking…",
			checkin: "Check in",
			checkingIn: "Checking in…",
			checkinDone: "Checked in today",
			checkinCredit: "Check-in credits",
			totalCredit: "Total credits",
			refreshModels: "Refresh models",
			refreshing: "Refreshing…",
			model: "Model",
			modelEmpty: "No models for this provider",
			modelEnable: "Enable and use this model",
			creditShort: "credits",
			creditUnknown: "—",
			pool: "Account pool",
			poolUnit: " accounts",
			poolStatAccounts: "Accounts",
			poolStatAvailable: "Ready",
			poolStatCooling: "Cooling",
			poolStatCalls: "Calls",
			poolStatFirstToken: "First token",
			poolStatSpeed: "Token speed",
			poolStatTokens: "Tokens",
			tabPool: "Accounts",
			tabUsage: "Usage",
			usageRange1d: "Last 1 day",
			usageRange3d: "Last 3 days",
			usageRange7d: "Last 7 days",
			usageRange14d: "Last 14 days",
			usageRangeAll: "All",
			usageRequests: "Requests",
			usageTotalTokens: "Total tokens",
			usagePrompt: "Input tokens",
			usageCompletion: "Output tokens",
			usageFailures: "Failures",
			usageAvgLatency: "Avg latency",
			usageAvgSpeed: "Avg speed",
			usageTokensPerCredit: "Tokens / credit",
			usageCreditsSpent: "Credits spent",
			usageCacheHitRate: "Cache hits",
			usageByAccount: "By account",
			usageByModel: "By model",
			usageByRegion: "By realm",
			usageColModel: "Model",
			usageColRealm: "Realm",
			usageColRequests: "Requests",
			usageColPrompt: "Input",
			usageColCompletion: "Output",
			usageColFailures: "Failed",
			usageColTotal: "Total",
			usageColLatency: "Avg latency",
			usageColSpeed: "Avg speed",
			usageEmpty: "No calls recorded in this window",
			usageRefresh: "Refresh usage",
			poolPackages: "Credit composition",
			packageCycle: "Cycle",
			packageExpires: "Expires",
			modelDefault: "Default",
			modelEfforts: "Efforts",
			modelContext: "Max context",
			modelOutput: "Max output",
			scan: "Scan for accounts",
			scanning: "Scanning",
			poolEmpty: "No accounts yet. Add one and sign in from the generated link.",
			acctCurrent: "In use",
			acctUse: "Switch to this account",
			acctUnknown: "Unnamed account",
			acctSuccess: "Success",
			acctCalls: "calls",
			acctLastSuccess: "Last success",
			acctNoCalls: "No calls",
			acctInFlight: "In flight",
			addAccount: "Add account",
			poolCreditsLabel: "Credits",
			refreshCredits: "Refresh credits",
			refreshingCredits: "Refreshing",
			hideNames: "Hide account names",
			nameHidden: "Hidden",
			creditsFailed: "Credits refresh failed",
			addHint: "Generate a sign-in link, then sign in with the account you want to add; it joins the pool automatically.",
			addStart: "Generate sign-in link",
			addStarting: "Generating…",
			addWaiting: "Waiting for the browser to finish…",
			addOpen: "Open sign-in page",
			addCopy: "Copy link",
			addCopied: "Copied",
			addCopyFailed: "Copy failed - select the link manually",
			addDone: "Added to the pool",
			addClose: "Close",
			addCancel: "Cancel",
			addErrHttp: "Add failed",
			modelImage: "Image",
			contextBudget: "Context",
			context200k: "200K",
			notWritable: "Settings are not writable",
			modelEnabledHint: "Enabled",
			modelUse: "Use",
			loading: "Loading…",
			noSession: "Open a session first",
			noAccount: "No account detected",
			signedOut: "Signed out",
			signedIn: "Signed in",
			requestFailed: "Request failed",
			panelFailed: "Panel failed to render",
			poolHealthOk: "Ready",
			poolHealthCooling: "Cooling",
			poolHealthModelLimited: "Model limited",
			coolingUntil: "until",
			modelLimitUntil: "Reset",
			modelLimitHint: "This model is rate-limited upstream; other models remain available",
			checkinAll: "Check in all",
			checkinAllBusy: "Checking in…",
			checkinAllDone: "All checked in",
			checkinOne: "Check in",
			checkinOneDone: "Checked in",
			checkinOneBusy: "Working",
			coolingHint: "The upstream refused this account (rate limit or spent allowance); another account covers it until then"
		};
		/**
		* Effort label for one picker row, reading both reasoning shapes the host
		* hands out: the usage document's `{supportedEfforts,defaultEffort}` and the
		* routable catalog's `{efforts:[{id}]}`. Returns undefined when the model
		* advertises no efforts, so the row simply draws no tag.
		*/
		function reasoningTagOf(model) {
			const reasoning = model?.reasoning;
			if (reasoning === void 0 || reasoning === null) return void 0;
			const efforts = Array.isArray(reasoning.efforts) ? reasoning.efforts.map((effort) => effort?.id).filter((id) => typeof id === "string") : Array.isArray(reasoning.supportedEfforts) ? reasoning.supportedEfforts.filter((id) => typeof id === "string") : [];
			return efforts.length === 0 ? void 0 : efforts.join("/");
		}
		function reasoningDefaultOf(model) {
			const effort = model?.reasoning?.defaultEffort;
			return typeof effort === "string" && effort !== "" ? effort : void 0;
		}
		/**
		* Contains render failures to the panel body.
		*
		* The slot renderer treats a throwing entry as crashed and draws nothing, so
		* an unexpected shape in one field would remove the sidebar entry itself.
		* Catching here keeps the trigger mounted and turns the failure into copy.
		*/
		class WorkBuddySidebarBoundary extends react.Component {
			constructor(props) {
				super(props);
				this.state = { message: void 0 };
			}
			static getDerivedStateFromError(error) {
				return { message: error instanceof Error ? error.message : String(error) };
			}
			componentDidCatch(error) {
				console.error("[dsh-connect-workbuddy] sidebar panel render failed:", error);
			}
			render() {
				if (this.state.message === void 0) return this.props.children;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-wb-side-error",
					role: "alert",
					children: (this.props.label ?? "面板渲染失败") + ": " + this.state.message
				});
			}
		}
		/**
		* Credit-multiplier label for one picker row, in this deployment's usual
		* `x0.03` spelling. A model without a usable rate yields undefined, so the
		* row shows nothing rather than a wrong `x0` or `NaN`.
		*/
		function multiplierLabelOf(model) {
			const rate = model?.creditMultiplier;
			if (typeof rate !== "number" || !Number.isFinite(rate)) return void 0;
			return `x${rate.toFixed(2)}`;
		}
		/**
* Credits as a complete, readable figure.
*
* Deliberately NOT compacted to "1.2K": a credits balance is a figure the user
* acts on, and the rounded form loses the exact value. Grouped digits keep it
* legible at a glance without ever hiding magnitude.
*/
function formatSidebarCredits(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "—";
	return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/**
* One account's credits as "remaining / capacity".
*
* The pool summary above already shows this pair for the whole region, so the
* row uses the same form and the same rounded figures; a row whose capacity the
* upstream never reported falls back to the remaining figure alone rather than
* inventing a denominator.
*/
function poolAccountCreditsLabel(remaining, capacity) {
	const hasRemaining = typeof remaining === "number" && Number.isFinite(remaining) && remaining >= 0;
	const hasCapacity = typeof capacity === "number" && Number.isFinite(capacity) && capacity > 0;
	if (!hasRemaining) return hasCapacity ? `— / ${formatSidebarCredits(capacity)}` : "—";
	return hasCapacity ? `${formatSidebarCredits(remaining)} / ${formatSidebarCredits(capacity)}` : formatSidebarCredits(remaining);
}
/** Compact date for a credit package refresh or expiry boundary. */
function formatSidebarPackageDate(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return void 0;
	return `${date.getMonth() + 1}/${date.getDate()}`;
}
/** Compact capacity label ("1M", "200K") matching the settings card's wording. */
		function formatSidebarCapacity(value) {
			if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
			if (value >= 1e6) return `${Number((value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1))}M`;
			if (value >= 1e3) return `${Number((value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 1))}K`;
			return String(value);
		}
		/** The two WorkBuddy providers, in switch order, with their host provider ids. */
/** A measured latency in the unit a person reads at a glance: 840ms / 3.1s. */
function formatSidebarLatency(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	return value < 1e3 ? `${Math.round(value)}ms` : `${(value / 1e3).toFixed(value < 1e4 ? 1 : 0)}s`;
}
/** Token counts in the same K/M shorthand the composer uses for its own readout. */
function formatSidebarTokens(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	if (value < 1e3) return String(Math.round(value));
	if (value < 1e6) return `${(value / 1e3).toFixed(value < 1e5 ? 1 : 0)}K`;
	return `${(value / 1e6).toFixed(1)}M`;
}
/** Throughput at one decimal, so the figure does not jitter as it ticks. */
function formatSidebarSpeed(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	return `${value.toFixed(1)} tok/s`;
}
/**
* Region rollup for the pool header. The host derives every average, so this only
* refuses anything that is not a finite, non-negative number - a missing figure
* stays missing and the panel prints a dash instead of a zero it never measured.
*/
/** Compact count for the usage tables: 16.95M / 35.3k / 120. */
function formatUsageCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	if (value < 1e3) return String(Math.round(value));
	if (value < 1e6) return `${(value / 1e3).toFixed(value < 1e4 ? 2 : 1)}k`;
	return `${(value / 1e6).toFixed(2)}M`;
}
/** Latency for the usage view: seconds with two decimals, as the reference does. */
function formatUsageLatency(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "—";
	return `${(ms / 1e3).toFixed(2)}s`;
}
/** Throughput for the usage view, one decimal. */
function formatUsageSpeed(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
	return `${value.toFixed(1)} tok/s`;
}
/**
* "How many tokens one credit buys", from the upstream's own bill.
*
* Shown as a plain count with a grouping separator: this is a headline the user
* compares against other models, so a rounded "8.8k" would hide the difference
* that matters. Absent when nothing was billed in the window, never a zero.
*/
function formatUsageTokensPerCredit(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
	return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/** Credits as a small decimal; the upstream bills to 0.01 but we keep 4 places. */
function formatUsageCredits(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 1e4) / 1e4);
}
/**
* Keep one server-provided aggregate row to finite, non-negative numbers. The
* host ships an absent average rather than a zero when nothing was measured, so
* an absent field stays absent here and its cell renders a dash.
*/
function normalizeUsageRow(raw, keyName) {
	const out = keyName === void 0 ? {} : { [keyName]: typeof raw?.[keyName] === "string" ? raw[keyName] : "" };
	const number = (key) => typeof raw?.[key] === "number" && Number.isFinite(raw[key]) && raw[key] >= 0 ? raw[key] : 0;
	out.calls = number("calls");
	out.failures = number("failures");
	out.promptTokens = number("promptTokens");
	out.completionTokens = number("completionTokens");
	out.totalTokens = number("totalTokens");
	out.credits = number("credits");
	out.cacheHitTokens = number("cacheHitTokens");
	out.cacheMissTokens = number("cacheMissTokens");
	/* Rounded to a whole token: the underlying bill is quantised to 0.01 credits
	   anyway, so a fractional figure would imply precision that is not there. */
	const tokensPerCredit = number("tokensPerCredit");
	if (tokensPerCredit > 0) out.tokensPerCredit = Math.round(tokensPerCredit);
	const avgLatencyMs = number("avgLatencyMs");
	if (avgLatencyMs > 0) out.avgLatencyMs = avgLatencyMs;
	const avgTokensPerSecond = number("avgTokensPerSecond");
	if (avgTokensPerSecond > 0) out.avgTokensPerSecond = avgTokensPerSecond;
	return out;
}
/**
* The usage document as the view renders it. Anything malformed degrades to an
* empty window instead of throwing: a bad readout must not blank the panel.
*/
function normalizeSidebarUsage(raw) {
	const out = {
		range: typeof raw?.range === "string" ? raw.range : "3d",
		since: typeof raw?.since === "number" ? raw.since : 0,
		until: typeof raw?.until === "number" ? raw.until : 0,
		totals: normalizeUsageRow(raw?.totals),
		series: [],
		accounts: [],
		models: [],
		regions: []
	};
	for (const entry of Array.isArray(raw?.series) ? raw.series : []) {
		if (entry === null || typeof entry !== "object") continue;
		const hour = typeof entry.hour === "number" && Number.isFinite(entry.hour) ? entry.hour : 0;
		if (hour <= 0) continue;
		out.series.push({
			hour,
			...normalizeUsageRow(entry)
		});
	}
	out.series.sort((left, right) => left.hour - right.hour);
	for (const entry of Array.isArray(raw?.accounts) ? raw.accounts : []) {
		if (entry === null || typeof entry !== "object") continue;
		const row = normalizeUsageRow(entry, "accountId");
		row.region = typeof entry.region === "string" ? entry.region : "";
		out.accounts.push(row);
	}
	for (const entry of Array.isArray(raw?.models) ? raw.models : []) {
		if (entry === null || typeof entry !== "object") continue;
		out.models.push(normalizeUsageRow(entry, "model"));
	}
	for (const entry of Array.isArray(raw?.regions) ? raw.regions : []) {
		if (entry === null || typeof entry !== "object") continue;
		out.regions.push(normalizeUsageRow(entry, "region"));
	}
	return out;
}
function normalizeSidebarPoolTotals(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object") return out;
	const number = (key) => typeof raw[key] === "number" && Number.isFinite(raw[key]) && raw[key] >= 0 ? raw[key] : 0;
	out.calls = number("calls");
	const firstTokenMs = number("firstTokenMs");
	if (firstTokenMs > 0) out.firstTokenMs = firstTokenMs;
	const tokensPerSecond = number("tokensPerSecond");
	if (tokensPerSecond > 0) out.tokensPerSecond = tokensPerSecond;
	const totalTokens = number("totalTokens");
	if (totalTokens > 0) out.totalTokens = totalTokens;
	return out;
}
/** Per-account credits for the pool rows. */
const WORKBUDDY_POOL_CREDITS_PATH = "/plugins/dsh-connect-workbuddy/pool/credits";
/**
* Last known panel data, kept OUTSIDE React.
*
* Switching to the 对话 tab unmounts this view, so every `useState` starts empty
* when the user comes back - which flashed an "未登录 / 0 个账号" shell until the
* fetches returned. Caching the last good snapshot here lets a remount paint the
* real figures immediately and then refresh in place, so the panel never shows a
* bogus empty state. Cleared only when the host reloads the bundle (i.e. a real
* plugin reload), never by tab switching.
*/
const WORKBUDDY_PANEL_CACHE = {
	status: void 0,
	fetched: [],
	enabledIds: [],
	imageIds: [],
	accounts: [],
	poolCredits: {},
	poolStats: {},
	poolTotals: {},
	poolHealth: {},
	poolModelHealth: {},
	poolCheckin: {},
	poolDetails: {},
	usageStats: void 0,
	/** Which region the cached figures belong to, so a provider switch still clears. */
	region: void 0,
	/** True once anything has been stored, so we can tell "empty" from "unknown". */
	warm: false
};
/** Memory-only per-account model request stats, polled faster than credits. */
const WORKBUDDY_POOL_STATS_PATH = "/plugins/dsh-connect-workbuddy/pool/stats";
/** Hourly usage analytics: requests, tokens, latency and rate over a window. */
const WORKBUDDY_USAGE_STATS_PATH = "/plugins/dsh-connect-workbuddy/usage-stats";
/** Windows the usage view offers, in the order it offers them. */
const WORKBUDDY_USAGE_RANGES = [
	"1d",
	"3d",
	"7d",
	"14d",
	"all"
];
/** Range id -> copy key. Spelled out because "all" would otherwise become
 *  `usageRangeall`, which no locale defines. */
const WORKBUDDY_USAGE_RANGE_LABELS = {
	"1d": "usageRange1d",
	"3d": "usageRange3d",
	"7d": "usageRange7d",
	"14d": "usageRange14d",
	all: "usageRangeAll"
};
/** Name visibility is a display preference, remembered per browser. */
const NAMES_HIDDEN_KEY = "dsh.workbuddy.pool.hideNames";
/**
* UI preferences that must survive a tab switch, a page reload and a restart.
*
* These are display choices, not provider configuration, so they live in
* localStorage next to the existing name-visibility switch rather than in the
* plugin's settings (which is per-provider and would need a region to read).
*
* The region one is why this exists: the panel unmounts when the user visits the
* 对话 tab, so a plain useState fell back to 国内版 every time - the user picked
* 国际版 and it silently reverted.
*/
const PREFERENCES_KEY = "dsh.workbuddy.panel.prefs";
/** Read the saved UI preferences; malformed or absent storage yields {}. */
function readPanelPreferences() {
	try {
		const raw = window.localStorage.getItem(PREFERENCES_KEY);
		if (raw === null) return {};
		const parsed = JSON.parse(raw);
		return parsed !== null && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
/** Persist one preference, merging into whatever is already stored. */
function writePanelPreference(key, value) {
	try {
		const next = { ...readPanelPreferences(), [key]: value };
		window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
	} catch {
		/* private mode or a full quota: the choice just will not be remembered */
	}
}
/** Credits auto-refresh cadence, in milliseconds. */
const CREDITS_REFRESH_MS = 30000;
/** Live request stats are cheap and memory-only, so they can update quickly. */
const POOL_STATS_REFRESH_MS = 4000;
/** Per-account daily check-in: one named account, or every account at once. */
const WORKBUDDY_POOL_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/pool/checkin";
/** Add account: mint a device-authorization link on the host, then poll it. */
const WORKBUDDY_LOGIN_START_PATH = "/plugins/dsh-connect-workbuddy/login/start";
const WORKBUDDY_LOGIN_POLL_PATH = "/plugins/dsh-connect-workbuddy/login/poll";
/** The sign-in round trip happens in a browser tab, so poll on a slow cadence. */
const LOGIN_POLL_MS = 3000;
/**
* When a cooling account comes back, as a clock time rather than a countdown:
* the panel sits open for minutes at a time, so "冷却至 15:36" stays true while
* "还有 12 分钟" silently rots. Today shows the clock alone, later days add the
* date so a 24h allowance reset is not mistaken for this afternoon.
*/
function formatSidebarCooling(untilMs, now = Date.now()) {
	if (typeof untilMs !== "number" || !Number.isFinite(untilMs) || untilMs <= now) return void 0;
	const at = new Date(untilMs);
	const pad = (value) => String(value).padStart(2, "0");
	const clock = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
	const sameDay = at.getFullYear() === new Date(now).getFullYear() && at.getMonth() === new Date(now).getMonth() && at.getDate() === new Date(now).getDate();
	return sameDay ? clock : `${pad(at.getMonth() + 1)}/${pad(at.getDate())} ${clock}`;
}
/** Human age for the most recent successful model call. */
function formatSidebarLastSuccess(value, now = Date.now()) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	const age = Math.max(0, now - value);
	if (age < 6e4) return "刚刚";
	if (age < 36e5) return `${Math.max(1, Math.round(age / 6e4))} 分钟前`;
	if (age < 864e5) return `${Math.max(1, Math.round(age / 36e5))} 小时前`;
	const at = new Date(value);
	const pad = (number) => String(number).padStart(2, "0");
	return `${pad(at.getMonth() + 1)}/${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
/** Keep the stats map to finite, non-negative numbers before it reaches React. */
function normalizeSidebarPoolStats(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object") return out;
	for (const [id, value] of Object.entries(raw)) {
		if (typeof id !== "string" || id === "" || value === null || typeof value !== "object") continue;
		const number = (key) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 ? value[key] : 0;
		const lastSuccessAt = number("lastSuccessAt");
		out[id] = {
			total: number("total"),
			successes: number("successes"),
			failures: number("failures"),
			inFlight: number("inFlight"),
			...lastSuccessAt === 0 ? {} : { lastSuccessAt }
		};
	}
	return out;
}
/** Model-scoped limits, keyed account -> model, before they reach React. */
function normalizeSidebarPoolModelHealth(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return out;
	for (const [accountId, accountValue] of Object.entries(raw)) {
		if (typeof accountId !== "string" || accountId === "" || accountValue === null || typeof accountValue !== "object" || Array.isArray(accountValue)) continue;
		const models = {};
		for (const [modelId, value] of Object.entries(accountValue)) {
			if (typeof modelId !== "string" || modelId === "" || value === null || typeof value !== "object" || Array.isArray(value)) continue;
			const until = typeof value.until === "number" && Number.isFinite(value.until) && value.until > 0 ? value.until : 0;
			if (until === 0) continue;
			models[modelId] = {
				kind: typeof value.kind === "string" ? value.kind : "rate",
				until,
				...typeof value.reason === "string" && value.reason !== "" ? { reason: value.reason } : {}
			};
		}
		if (Object.keys(models).length > 0) out[accountId] = models;
	}
	return out;
}
/**
* How much room the host's floating composer needs at the bottom of the tab.
*
* Measured from the composer itself rather than hard-coded: the dock grows and
* shrinks with the thinking-level row, the slider and the token readout, and a
* fixed number that clears it today sits on top of it tomorrow. Walks up from
* the send button to the dock root - the highest ancestor still anchored to the
* window bottom - and leaves a margin for the toolbar row above it.
*/
function workBuddyDockClearance() {
	const FALLBACK = 200;
	try {
		const byLabel = document.querySelector("button[aria-label*=\"发送消息\"],button[aria-label*=\"发送\"],button[aria-label*=\"Send\"],button[aria-label*=\"send\"]");
		let send = byLabel;
		if (send === null) {
			/**
			* The composer's send control is the last match in DOM order; the label may
			* live in its text rather than an aria attribute, so match either.
			*/
			const candidates = document.querySelectorAll("button,[role=\"button\"]");
			for (let index = candidates.length - 1; index >= 0; index -= 1) {
				const node = candidates[index];
				const label = `${node.getAttribute("aria-label") ?? ""} ${node.getAttribute("title") ?? ""} ${node.textContent ?? ""}`;
				if (/发送|Send/i.test(label)) {
					send = node;
					break;
				}
			}
		}
		if (send === null) return FALLBACK;
		let node = send;
		while (node.parentElement !== null) {
			const parentRect = node.parentElement.getBoundingClientRect();
			if (parentRect.height > window.innerHeight * 0.6) break;
			node = node.parentElement;
		}
		const rect = node.getBoundingClientRect();
		if (!(rect.height > 0)) return FALLBACK;
		const needed = Math.round(window.innerHeight - rect.top) + 56;
		return Math.min(460, Math.max(140, needed));
	} catch (error) {
		return FALLBACK;
	}
}
		const WORKBUDDY_SIDEBAR_REGIONS = [
			{
				id: "cn",
				provider: "workbuddy",
				label: "国内版"
			},
			{
				id: "global",
				provider: "workbuddy-global",
				label: "国际版"
			}
		];
		/** Map a panel region id to the host provider route it addresses. */
		function workBuddySidebarProvider(region) {
			return (WORKBUDDY_SIDEBAR_REGIONS.find((entry) => entry.id === region) ?? WORKBUDDY_SIDEBAR_REGIONS[0]).provider;
		}
		/**
		* The sidebar panel: provider switch, account recheck, check-in, both credit
		* figures, model refresh, and model selection for one WorkBuddy provider.
		*
		* Every provider switch clears the previous provider's data before anything
		* new is fetched, so the two providers' accounts and credits never render
		* together. Every request disables its own control, and every failure lands
		* in a visible message rather than leaving the panel blank.
		*/
		function WorkBuddySidebar({ wide, t, useSessions, modelDirectories, settingsScope, region: regionProp, mode, sessionId }) {
			const copy = t ?? ((key) => WORKBUDDY_SIDEBAR_ZH[key] ?? key);
			const storedSession = useSessions((state) => state.current);
			/**
			* The main-area view is handed its own session id; the sidebar popover has
			* none and must read the live store instead. Preferring the prop is what
			* makes "使用" work from the tab: reading only the store left it undefined
			* there, so activation failed with "请先打开一个会话" even with a session open.
			*/
			const currentSession = typeof sessionId === "string" && sessionId !== "" ? sessionId : storedSession;
			const [open, setOpen] = (0, react.useState)(false);
			/** Main-area variant: no trigger, always expanded, sized by the view slot. */
			const isView = mode === "view";
			/**
			* Saved UI preferences, read once at mount.
			*
			* `regionProp` still wins when the host supplies one, because that is an
			* explicit instruction for this mount; otherwise the user's last choice is
			* restored. Without this the panel reverted to 国内版 on every remount.
			*/
			const savedPrefs = (0, react.useCallback)(readPanelPreferences, [])();
			const [region, setRegion] = (0, react.useState)(regionProp ?? (savedPrefs.region === "global" || savedPrefs.region === "cn" ? savedPrefs.region : "cn"));
			/** Set a preference and remember it, so it survives remount and reload. */
			const remember = (key, value) => writePanelPreference(key, value);
			/* seed every one of these from the module cache: a remount (the user
			   switching back from 对话) then paints the last real figures at once
			   instead of an empty shell that reads as "未登录 / 0 个账号" */
			const [status, setStatus] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.status);
			const [busy, setBusy] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(void 0);
			const [groups, setGroups] = (0, react.useState)([]);
			const [failures, setFailures] = (0, react.useState)([]);
			/** Models this provider actually returned from the upstream, in that order. */
			const [fetched, setFetched] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.fetched);
			/** Ids the provider currently serves as routable, so selection can enable one. */
			const [enabledIds, setEnabledIds] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.enabledIds);
			/**
			* Accounts the current provider's store can see, in host order. The pool is
			* a projection of credential files, so this list is the pool.
			*/
			const [accounts, setAccounts] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.accounts);
			/** Each pooled account's own credits, keyed by account id. */
			const [poolCredits, setPoolCredits] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolCredits);
			/** Live model-call stats per account: rate, in-flight count, last success. */
			const [poolStats, setPoolStats] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolStats);
			/** Region rollup under the pool summary: calls, latency, speed, tokens. */
			const [poolTotals, setPoolTotals] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolTotals);
			/** Per-model upstream limits, kept apart from account-wide cooling. */
			const [poolModelHealth, setPoolModelHealth] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolModelHealth);
			/** Which surface of this tab is showing: the account pool or usage. */
			const [tab, setTab] = (0, react.useState)(savedPrefs.tab === "usage" ? "usage" : "pool");
			/** Aggregated usage for the selected window, empty until first load. */
			const [usageStats, setUsageStats] = (0, react.useState)(() => WORKBUDDY_PANEL_CACHE.usageStats ?? normalizeSidebarUsage(void 0));
			const [usageRange, setUsageRange] = (0, react.useState)(WORKBUDDY_USAGE_RANGES.includes(savedPrefs.usageRange) ? savedPrefs.usageRange : "3d");
			const [usageBusy, setUsageBusy] = (0, react.useState)(false);
			const [usageError, setUsageError] = (0, react.useState)(void 0);
			const [poolHealth, setPoolHealth] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolHealth);
			const [poolCheckin, setPoolCheckin] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolCheckin);
			const [poolDetails, setPoolDetails] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolDetails);
			const [checkinOneBusy, setCheckinOneBusy] = (0, react.useState)("");
			const [checkinAllBusy, setCheckinAllBusy] = (0, react.useState)(false);
			const [creditsError, setCreditsError] = (0, react.useState)(void 0);
			/** Name visibility is a display preference; remembered across reloads. */
			const [hideNames, setHideNames] = (0, react.useState)(() => {
				try {
					return window.localStorage.getItem(NAMES_HIDDEN_KEY) === "1";
				} catch {
					return false;
				}
			});
			/** Add-account flow: a sign-in step plus its own error surface. */
			const [addOpen, setAddOpen] = (0, react.useState)(false);
			const [addError, setAddError] = (0, react.useState)(void 0);
			/** idle -> starting -> waiting -> done; the link is live while waiting. */
			const [addPhase, setAddPhase] = (0, react.useState)("idle");
			const [addLink, setAddLink] = (0, react.useState)(void 0);
			const [addState, setAddState] = (0, react.useState)(void 0);
			const [addName, setAddName] = (0, react.useState)(void 0);
			const [addCopied, setAddCopied] = (0, react.useState)(false);
			/** Model ids allowed to receive images, per provider (never shared). */
			const [imageIds, setImageIds] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.imageIds);
			/** Per-model context budget choices, per provider. */
			const [contextBudgets, setContextBudgets] = (0, react.useState)({});
			const [selected, setSelected] = (0, react.useState)(void 0);
			const mounted = (0, react.useRef)(true);
			/** Wraps the trigger and the panel; an outside press closes the panel. */
			const layerRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			/**
			* Collapse the panel when a press lands outside it.
			*
			* The listener is capture-phase and mounted only while open, so any
			* interaction inside the layer (trigger or panel body) is ignored and the
			* panel's own controls keep working; the trigger keeps toggling itself.
			*/
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPress = (event) => {
					const layer = layerRef.current;
					if (layer !== null && layer.contains(event.target)) return;
					setOpen(false);
				};
				document.addEventListener("pointerdown", onPress, true);
				return () => document.removeEventListener("pointerdown", onPress, true);
			}, [open]);
			const provider = workBuddySidebarProvider(region);
			/** Read this region's usage document (account, credits, check-in, models). */
			const loadUsage = (0, react.useCallback)(async (target) => {
				/**
				* `fast=1` asks the host for the local half only (account, models,
				* enabled sets). That answers without an upstream round trip, so a
				* provider switch can paint at once; the caller then refreshes the
				* slower credits/check-in fields in the background.
				*/
				const response = await fetch(`${withWorkBuddyRegion(WORKBUDDY_USAGE_PATH, target)}&fast=1`, {
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			}, []);
			/** Re-read usage and the platform model directory for this region. */
			/**
			* The two upstream-backed summary fields (积分卡: 总积分 / 签到积分).
			*
			* Split out because the 积分 card DOES read `status.credits` and
			* `status.checkin`, so the fast half alone would leave them as "—". This
			* merges only those two fields, letting everything else paint without
			* waiting for the upstream round trip.
			*/
			const loadUsageSummary = (0, react.useCallback)(async (target) => {
				const response = await fetch(withWorkBuddyRegion(WORKBUDDY_USAGE_PATH, target), {
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			}, []);
			const reload = (0, react.useCallback)(async (target) => {
				/**
				* Fire the slow half AT THE SAME TIME as the fast half.
				*
				* Sequencing them (fast, then full) made the extras cost the panel a
				* second glance at the switch: measured 1614ms for the fast call because
				* it was queued behind the full one. Both are independent reads, so they
				* go out together and the full one only merges the two slow fields.
				*/
				/* credits ride alongside the two usage reads rather than queueing behind
				   them: this is the request that costs an upstream round trip, so it must
				   not also pay for the fast call's latency. Region is explicit so a switch
				   can never address the provider we just left. */
				void loadPoolCredits({
					region: target
				});
				/* the 积分卡's two upstream-backed fields, fetched in parallel */
				const summaryPromise = loadUsageSummary(target).catch(() => void 0);
				/**
				* The advisory model directory loads INDEPENDENTLY of the panel data.
				*
				* These used to be joined with Promise.all, which meant the fast status
				* response (measured 60ms) sat unused until `directory.load()` finished -
				* that join, not the network, was why a switch stayed blank. The directory
				* is advisory: the panel's own model roster comes from the status
				* document, so nothing here needs to wait for it.
				*/
				void (async () => {
					if (currentSession === void 0 || modelDirectories === void 0) return;
					try {
						const directory = modelDirectories.directoryFor(currentSession);
						await directory.load();
						if (!mounted.current) return;
						const snapshot = directory.store.getSnapshot();
						setGroups(snapshot.groups);
						setFailures(snapshot.failures ?? []);
						setSelected(snapshot.current ?? void 0);
					} catch {
						/* the usage document still renders; the model list is advisory */
					}
				})();
				const usage = await loadUsage(target);
				if (!mounted.current) return;
				setStatus(usage);
				/**
				* Merge the slow fields AFTER the fast document is applied.
				*
				* `setStatus(usage)` above replaces the whole object, so merging earlier
				* (while the summary was still in flight) got overwritten and the 积分卡
				* fell back to "—". Awaiting here keeps the fast paint - the status is
				* already on screen - while the two extras fill in behind it.
				*/
				void summaryPromise.then((summary) => {
					if (!mounted.current || summary === null || typeof summary !== "object") return;
					const mergeInto = (previous) => ({
						...(previous ?? {}),
						...summary.credits === void 0 ? {} : { credits: summary.credits },
						...summary.creditsError === void 0 ? {} : { creditsError: summary.creditsError },
						...summary.checkin === void 0 ? {} : { checkin: summary.checkin },
						...summary.checkinError === void 0 ? {} : { checkinError: summary.checkinError }
					});
					setStatus(mergeInto);
					/* keep the cache in step, or a remount would paint "—" again */
					WORKBUDDY_PANEL_CACHE.status = mergeInto(WORKBUDDY_PANEL_CACHE.status);
				});
				WORKBUDDY_PANEL_CACHE.status = usage;
				/* `target`, not `region`: this callback is created once per render and the
				   closed-over `region` is still the OLD provider while a switch is in
				   flight, which is what let a credits request go to the previous region. */
				WORKBUDDY_PANEL_CACHE.region = target;
				WORKBUDDY_PANEL_CACHE.warm = true;
				// The provider's own fetched list is the source of truth for the
				// picker; the routable catalog is the subset already enabled.
				setFetched(Array.isArray(usage?.models) ? usage.models : []);
				setEnabledIds(Array.isArray(usage?.enabledModelIds) ? usage.enabledModelIds : []);
				setImageIds(Array.isArray(usage?.imageModelIds) ? usage.imageModelIds : []);
				setAccounts(Array.isArray(usage?.accounts) ? usage.accounts : []);
				WORKBUDDY_PANEL_CACHE.fetched = Array.isArray(usage?.models) ? usage.models : [];
				WORKBUDDY_PANEL_CACHE.enabledIds = Array.isArray(usage?.enabledModelIds) ? usage.enabledModelIds : [];
				WORKBUDDY_PANEL_CACHE.imageIds = Array.isArray(usage?.imageModelIds) ? usage.imageModelIds : [];
				WORKBUDDY_PANEL_CACHE.accounts = Array.isArray(usage?.accounts) ? usage.accounts : [];
				// Context budgets are a settings value for this region, not a field of
				// the usage document (the settings card reads them the same way).
				const configuredRegions = settingsScope?.getSnapshot?.().value?.regions;
				const savedRegions = configuredRegions !== null && typeof configuredRegions === "object" ? configuredRegions : {};
				const savedBudgets = savedRegions[target]?.contextBudgets;
				setContextBudgets(savedBudgets !== null && typeof savedBudgets === "object" ? savedBudgets : {});
				/**
				* Deliberately no third read here.
				*
				* The switch now costs exactly two upstream-touching requests - the
				* per-account credits and the summary fields - and both are already in
				* flight above. Adding a "full status" fetch on top would duplicate
				* `fetchCredits` for a third time and slow the two that matter.
				*/
			}, [loadUsage, loadUsageSummary, currentSession, modelDirectories, settingsScope]);
			/** Switching providers clears the previous provider's data first. */
			(0, react.useEffect)(() => {
				/**
				* Only clear when the PROVIDER actually changes.
				*
				* This effect also runs on every remount (it depends on `open`), and
				* clearing there is what produced the empty "未登录 / 0 个账号" flash when
				* the user came back from the 对话 tab. The cache already holds the right
				* region's data, so a remount keeps it and just refreshes.
				*/
				/* the cache knows which provider its figures came from, and that survives
				   a remount - a per-component ref would not */
				const providerChanged = WORKBUDDY_PANEL_CACHE.region !== void 0 && WORKBUDDY_PANEL_CACHE.region !== region;
				if (providerChanged) {
					/* drop the other provider's cached figures too, so a remount cannot
					   paint them for the provider now selected */
					WORKBUDDY_PANEL_CACHE.status = void 0;
					WORKBUDDY_PANEL_CACHE.fetched = [];
					WORKBUDDY_PANEL_CACHE.enabledIds = [];
					WORKBUDDY_PANEL_CACHE.imageIds = [];
					WORKBUDDY_PANEL_CACHE.accounts = [];
					WORKBUDDY_PANEL_CACHE.poolCredits = {};
					WORKBUDDY_PANEL_CACHE.poolStats = {};
					WORKBUDDY_PANEL_CACHE.poolTotals = {};
					WORKBUDDY_PANEL_CACHE.poolDetails = {};
					WORKBUDDY_PANEL_CACHE.poolHealth = {};
					WORKBUDDY_PANEL_CACHE.poolModelHealth = {};
					WORKBUDDY_PANEL_CACHE.poolCheckin = {};
					WORKBUDDY_PANEL_CACHE.usageStats = void 0;
					WORKBUDDY_PANEL_CACHE.region = region;
					setStatus(void 0);
					setGroups([]);
					setFailures([]);
					setFetched([]);
					setEnabledIds([]);
					setImageIds([]);
					setAccounts([]);
					setPoolCredits({});
					setPoolStats({});
					setPoolTotals({});
					setPoolModelHealth({});
					/* usage is not region-scoped, but a provider switch resets the readout
					   so a stale window from the other provider never flashes */
					setUsageStats(normalizeSidebarUsage(void 0));
					setPoolDetails({});
					setCreditsError(void 0);
					setContextBudgets({});
					setSelected(void 0);
					setError(void 0);
				}
				// Render whatever the platform directory already holds, then refresh
				// it; the advisory catalog must not leave the list blank meanwhile.
				if (currentSession !== void 0 && modelDirectories !== void 0) {
					try {
						const snapshot = modelDirectories.directoryFor(currentSession).store.getSnapshot();
						setGroups(snapshot.groups);
						setFailures(snapshot.failures ?? []);
						if (snapshot.current !== null) setSelected(snapshot.current);
					} catch {
						/* an unavailable directory falls through to the loaded state */
					}
				}
				reload(region).catch((err) => {
					if (mounted.current) setError(err instanceof Error ? err.message : copy("requestFailed"));
				});
			}, [
				open,
				region,
				reload,
				currentSession,
				modelDirectories
			]);
			/** Host routes answer with a JSON error body; surface it verbatim. */
			const post = async (path) => {
				const response = await fetch(withWorkBuddyRegion(path, region), {
					method: "POST",
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			};
			/** Run one labelled action with its own busy state and error surface. */
			/**
			* Read every pooled account's own credits for this region. A failure keeps
			* whatever was last shown instead of blanking the numbers.
			*/
			const loadPoolCredits = (0, react.useCallback)(async (options) => {
				const quiet = options?.silent === true;
				/* an explicit region wins: a caller reacting to a provider switch knows
				   which provider it wants and must not read a stale closed-over value */
				const forRegion = typeof options?.region === "string" && options.region !== "" ? options.region : region;
				try {
					const response = await fetch(`${WORKBUDDY_POOL_CREDITS_PATH}?region=${forRegion}`, {
						headers: {
							accept: "application/json"
						},
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					const next = {};
					const health = {};
					const modelHealth = normalizeSidebarPoolModelHealth(body?.modelHealth);
					const checkin = {};
					const details = {};
					for (const entry of Array.isArray(body?.accounts) ? body.accounts : []) {
						if (typeof entry?.id !== "string") continue;
						next[entry.id] = typeof entry.credits === "number" && Number.isFinite(entry.credits) ? entry.credits : void 0;
						const packages = Array.isArray(entry.packages) ? entry.packages.filter((pack) => pack !== null && typeof pack === "object") : [];
						const creditsTotal = typeof entry.creditsTotal === "number" && Number.isFinite(entry.creditsTotal) ? entry.creditsTotal : packages.reduce((sum, pack) => sum + (typeof pack.size === "number" && Number.isFinite(pack.size) ? pack.size : 0), 0);
						details[entry.id] = {
							packages,
							creditsTotal
						};
						if (entry.checkin !== void 0) checkin[entry.id] = entry.checkin;
						if (entry.health !== void 0) health[entry.id] = entry.health;
					}
					if (!mounted.current) return;
				setPoolCredits(next);
				setPoolStats(normalizeSidebarPoolStats(body?.stats));
				setPoolTotals(normalizeSidebarPoolTotals(body?.totals));
				setPoolDetails(details);
				setPoolHealth({...health, ...body?.health ?? {}});
				setPoolModelHealth(modelHealth);
				setPoolCheckin(checkin);
				/* remember the last good figures so a remount after a tab switch paints
				   them immediately instead of an empty shell */
				WORKBUDDY_PANEL_CACHE.poolCredits = next;
				WORKBUDDY_PANEL_CACHE.poolStats = normalizeSidebarPoolStats(body?.stats);
				WORKBUDDY_PANEL_CACHE.poolTotals = normalizeSidebarPoolTotals(body?.totals);
				WORKBUDDY_PANEL_CACHE.poolDetails = details;
				WORKBUDDY_PANEL_CACHE.poolHealth = {...health, ...body?.health ?? {}};
				WORKBUDDY_PANEL_CACHE.poolModelHealth = modelHealth;
				WORKBUDDY_PANEL_CACHE.poolCheckin = checkin;
				WORKBUDDY_PANEL_CACHE.region = forRegion;
				WORKBUDDY_PANEL_CACHE.warm = true;
					if (!quiet) setCreditsError(void 0);
				} catch (err) {
					if (!mounted.current) return;
					/**
					* A quiet tick keeps the last good figures and stays off the alert row:
					* the 30s cadence must never turn a transient upstream hiccup into
					* something the user has to read, and must never disable the controls.
					*/
					if (!quiet) setCreditsError(err instanceof Error ? err.message : copy("requestFailed"));
				}
			}, [region]);
			/** Memory-only live tick; failures leave the last good stats untouched. */
			const loadPoolStats = (0, react.useCallback)(async () => {
				try {
					const response = await fetch(`${WORKBUDDY_POOL_STATS_PATH}?region=${region}`, {
						headers: {
							accept: "application/json"
						},
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) return;
					if (!mounted.current) return;
					setPoolStats(normalizeSidebarPoolStats(body?.stats));
					setPoolTotals(normalizeSidebarPoolTotals(body?.totals));
					setPoolModelHealth(normalizeSidebarPoolModelHealth(body?.modelHealth));
					WORKBUDDY_PANEL_CACHE.poolStats = normalizeSidebarPoolStats(body?.stats);
					WORKBUDDY_PANEL_CACHE.poolTotals = normalizeSidebarPoolTotals(body?.totals);
					WORKBUDDY_PANEL_CACHE.poolModelHealth = normalizeSidebarPoolModelHealth(body?.modelHealth);
					WORKBUDDY_PANEL_CACHE.region = region;
					WORKBUDDY_PANEL_CACHE.warm = true;
				} catch {}
			}, [region]);
			/**
			* Read the aggregated usage window. Kept separate from the pool loaders
			* because it answers a different question and refreshes on its own
			* cadence; a failure surfaces as a row rather than blanking the tables.
			*/
			const loadUsageStats = (0, react.useCallback)(async (range) => {
				setUsageBusy(true);
				try {
					const response = await fetch(`${WORKBUDDY_USAGE_STATS_PATH}?range=${range}`, {
						headers: {
							accept: "application/json"
						},
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					if (!mounted.current) return;
					setUsageStats(normalizeSidebarUsage(body));
					WORKBUDDY_PANEL_CACHE.usageStats = normalizeSidebarUsage(body);
					WORKBUDDY_PANEL_CACHE.warm = true;
					setUsageError(void 0);
				} catch (err) {
					if (mounted.current) setUsageError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) setUsageBusy(false);
				}
			}, []);
			/** Manual refresh: same readout, with the panel's busy state for feedback. */
			const refreshCredits = () => run("credits", () => loadPoolCredits());
			/**
			* Check in one named account, or every account in this region at once.
			* The busy flag is per subject, so one row working never freezes the rest.
			*/
			const checkinPool = async (accountId) => {
				const one = typeof accountId === "string" && accountId !== "";
				if (one) setCheckinOneBusy(accountId);
				else setCheckinAllBusy(true);
				try {
					const response = await fetch(`${WORKBUDDY_POOL_CHECKIN_PATH}?region=${region}`, {
						method: "POST",
						headers: {
							accept: "application/json",
							"content-type": "application/json"
						},
						credentials: "same-origin",
						body: JSON.stringify(one ? { accountId } : {})
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					await loadPoolCredits({
						silent: true
					});
					await reload(region).catch(() => {});
				} catch (err) {
					if (mounted.current) setCreditsError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) {
						if (one) setCheckinOneBusy("");
						else setCheckinAllBusy(false);
					}
				}
			};
			/**
			* Keep the tab clear of the host's floating composer. The dock is measured
			* from the live DOM and re-measured on resize, because its height changes
			* with the thinking row, the slider and the token readout - a hard-coded
			* clearance that fits today ends up under the input tomorrow.
			*/
			(0, react.useEffect)(() => {
				if (!isView) return void 0;
				const apply = () => {
					const node = document.querySelector(".dsm-wb-view-root");
					if (node === null) return;
					node.style.setProperty("--wb-view-clearance", `${workBuddyDockClearance()}px`);
				};
				apply();
				window.addEventListener("resize", apply);
				const timer = setInterval(apply, 2000);
				return () => {
					window.removeEventListener("resize", apply);
					clearInterval(timer);
				};
			}, [isView]);
			/**
			* Keep the figures fresh on a fixed cadence while the panel is open, and
			* skip the tick entirely when the page is hidden rather than polling blind.
			* The tick is silent on purpose: it must not raise the panel's busy state,
			* disable a button, or flash an error row while the user is working.
			*/
			(0, react.useEffect)(() => {
				if (!open && !isView) return void 0;
				const timer = setInterval(() => {
					if (document.visibilityState === "hidden") return;
					void loadPoolCredits({
						silent: true
					});
				}, CREDITS_REFRESH_MS);
				return () => clearInterval(timer);
			}, [open, isView, loadPoolCredits]);
			/**
			* Keep in-flight and last-success values current without touching the
			* upstream. Four seconds is enough to feel live while staying quiet.
			*/
			(0, react.useEffect)(() => {
				if (!open && !isView) return void 0;
				const timer = setInterval(() => {
					if (document.visibilityState === "hidden") return;
					void loadPoolStats();
				}, POOL_STATS_REFRESH_MS);
				return () => clearInterval(timer);
			}, [open, isView, loadPoolStats]);
			/**
			* Load usage when the usage surface becomes visible, and reload whenever the
			* window changes. Kept off the pool's cadences: this readout only matters
			* while it is on screen.
			*/
			(0, react.useEffect)(() => {
				if ((!open && !isView) || tab !== "usage") return void 0;
				void loadUsageStats(usageRange);
				return void 0;
			}, [open, isView, tab, usageRange, loadUsageStats]);
			/**
			* Make one pooled account the current one for this provider.
			*
			* Written through the same settings key the settings card uses
			* (`accounts[region]`), so both surfaces agree and no second store exists.
			* Only this region's entry is replaced, so the other provider's selection
			* is untouched.
			*/
			const switchAccount = (accountId) => run("account", async () => {
				if (settingsScope === void 0 || settingsScope.getSnapshot().writable !== true) throw new Error(copy("notWritable"));
				const configured = settingsScope.getSnapshot().value ?? {};
				const configuredAccounts = typeof configured.accounts === "object" && configured.accounts !== null ? configured.accounts : {};
				if (configuredAccounts[region] === accountId) return;
				await settingsScope.set("accounts", {
					...configuredAccounts,
					[region]: accountId
				});
			});
			/** Open the add-account form, always in its idle state. */
			const openAdd = () => {
				setAddError(void 0);
				setAddPhase("idle");
				setAddLink(void 0);
				setAddState(void 0);
				setAddName(void 0);
				setAddCopied(false);
				setAddOpen(true);
			};
			/**
			* Close the form. The host keeps its pending state, so re-opening can mint
			* a fresh link; the abandoned one simply expires upstream.
			*/
			const closeAdd = () => {
				setAddOpen(false);
				setAddPhase("idle");
				setAddLink(void 0);
				setAddState(void 0);
				setAddName(void 0);
				setAddCopied(false);
				setAddError(void 0);
			};
			/**
			* Add account, step 1: ask the host for a device-authorization link.
			*
			* The sign-in itself happens in the user's own browser session, so no
			* password or code ever passes through this panel; the host only holds
			* the pending state that step 2 collects the issued token from.
			*/
			const startAdd = async () => {
				setAddPhase("starting");
				setAddError(void 0);
				setAddCopied(false);
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_LOGIN_START_PATH, region), {
						method: "POST",
						headers: { accept: "application/json" },
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					if (typeof body?.url !== "string" || typeof body?.state !== "string") throw new Error(`${copy("addErrHttp")}: HTTP ${response.status}`);
					if (!mounted.current) return;
					setAddLink(body.url);
					setAddState(body.state);
					setAddPhase("waiting");
				} catch (err) {
					if (!mounted.current) return;
					setAddPhase("idle");
					setAddError(err instanceof Error ? err.message : copy("requestFailed"));
				}
			};
			/** The link is also plain text, so a blocked popup is never a dead end. */
			const openAddLink = () => {
				if (typeof addLink !== "string") return;
				window.open(addLink, "_blank", "noopener,noreferrer");
			};
			const copyAddLink = async () => {
				if (typeof addLink !== "string") return;
				try {
					await navigator.clipboard.writeText(addLink);
					if (mounted.current) setAddCopied(true);
				} catch {
					if (mounted.current) setAddError(copy("addCopyFailed"));
				}
			};
			/**
			* Add account, step 2: while the link is open, ask the host whether the
			* sign-in finished. The host owns the pending state, so the flow survives
			* a panel reload; the timer stops the moment the account lands.
			*/
			(0, react.useEffect)(() => {
				if (!addOpen || addPhase !== "waiting" || typeof addState !== "string") return void 0;
				let stopped = false;
				const tick = async () => {
					try {
						const response = await fetch(`${WORKBUDDY_LOGIN_POLL_PATH}?region=${region}&state=${encodeURIComponent(addState)}`, {
							headers: { accept: "application/json" },
							credentials: "same-origin"
						});
						const body = await response.json().catch(() => void 0);
						if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
						if (stopped || !mounted.current) return;
						if (body?.done !== true) return;
						setAddPhase("done");
						setAddName(typeof body?.account?.accountName === "string" ? body.account.accountName : void 0);
						window.setTimeout(() => {
							if (mounted.current) setAddOpen(false);
						}, 2400);
						await reload(region).catch(() => {});
					} catch (err) {
						if (stopped || !mounted.current) return;
						setAddPhase("idle");
						setAddError(err instanceof Error ? err.message : copy("requestFailed"));
					}
				};
				const timer = window.setInterval(() => {
					void tick();
				}, LOGIN_POLL_MS);
				void tick();
				return () => {
					stopped = true;
					window.clearInterval(timer);
				};
			}, [
				addOpen,
				addPhase,
				addState,
				region,
				reload
			]);
			const run = async (label, action) => {
				setBusy(label);
				setError(void 0);
				try {
					await action();
					await reload(region);
				} catch (err) {
					if (mounted.current) setError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) setBusy("");
				}
			};
			const rescan = () => run("rescan", async () => {
				const body = await post(WORKBUDDY_ACCOUNTS_REFRESH_PATH);
				if (!Array.isArray(body?.accounts)) throw new Error(`HTTP 200`);
				if (body.accounts.length === 0) throw new Error(copy("noAccount"));
			});
			const checkin = () => run("checkin", async () => {
				await post(WORKBUDDY_CHECKIN_PATH);
			});
			const refreshModels = () => run("models", async () => {
				const body = await post(WORKBUDDY_MODELS_REFRESH_PATH);
				if (!Array.isArray(body?.models)) throw new Error(`HTTP 200`);
			});
			/**
			* Merge one region's settings patch, preserving every sibling region.
			* Mirrors the settings card so both surfaces write the same shape.
			*/
			const patchRegion = async (patch) => {
				if (settingsScope === void 0 || settingsScope.getSnapshot().writable !== true) throw new Error(copy("notWritable"));
				const configured = settingsScope.getSnapshot().value ?? {};
				const regions = typeof configured.regions === "object" && configured.regions !== null ? configured.regions : {};
				const current = regions[region] ?? {};
				await settingsScope.set("regions", {
					...regions,
					[region]: {
						...current,
						...patch
					}
				});
			};
			/**
			* Toggle one model in this provider's enabled set.
			*
			* Multi-select by design: every checked model stays enabled and callable,
			* so unchecking one never clears the others. Selection is the settings
			* write itself — the host advertises exactly the enabled ids.
			*/
			const toggleModel = (modelId) => run("select", async () => {
				const current = Array.isArray(enabledIds) ? enabledIds : [];
				const next = current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId];
				await patchRegion({ enabledModelIds: next });
				setEnabledIds(next);
				WORKBUDDY_PANEL_CACHE.enabledIds = next;
				// Keep the session's model routable: if the current session model was
				// just unchecked, fall back to a model that is still enabled.
				const stillEnabled = selected !== void 0 && next.includes(selected.model);
				if (!stillEnabled && next.length > 0 && currentSession !== void 0 && modelDirectories !== void 0) {
					await modelDirectories.directoryFor(currentSession).select({
						provider,
						model: next.includes(selected?.model) ? selected.model : next[0]
					});
				}
			});
			/** Toggle image input for one model (per provider, never shared). */
			const toggleImage = (modelId) => run("image", async () => {
				const current = Array.isArray(imageIds) ? imageIds : [];
				const next = current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId];
				await patchRegion({ imageModelIds: next });
				setImageIds(next);
				WORKBUDDY_PANEL_CACHE.imageIds = next;
			});
			/**
			* Choose one model's context budget.
			*
			* Only models whose native window exceeds the 200K floor offer the pair,
			* matching the settings card's rule.
			*/
			const setContextBudget = (modelId, budget) => run("context", async () => {
				const next = {
					...contextBudgets,
					[modelId]: budget
				};
				await patchRegion({ contextBudgets: next });
				setContextBudgets(next);
			});
			/** Make one enabled model the session's active model. */
			const activateModel = (modelId) => run("activate", async () => {
				if (currentSession === void 0) throw new Error(copy("noSession"));
				if (modelDirectories === void 0) throw new Error(copy("requestFailed"));
				await modelDirectories.directoryFor(currentSession).select({
					provider,
					model: modelId
				});
			});
			const credits = status !== null && typeof status === "object" ? status.credits : void 0;
			const checkinState = status !== null && typeof status === "object" ? status.checkin : void 0;
			const totalCredit = typeof credits?.total === "number" && Number.isFinite(credits.total) ? credits.total : void 0;
			const checkinCredit = typeof checkinState?.todayCredit === "number" ? checkinState.todayCredit : typeof checkinState?.dailyCredit === "number" ? checkinState.dailyCredit : void 0;
			/** WorkBuddy Global has no daily check-in upstream, so its control is not offered. */
			const supportsCheckin = region === "cn";
			/** True when every pooled account of this provider already checked in today. */
			const poolAllCheckedIn = accounts.length > 0 && accounts.every((account) => poolCheckin[account.id]?.todayCheckedIn === true);
			const poolCoolingCount = accounts.filter((account) => {
				const until = poolHealth[account.id]?.until;
				return typeof until === "number" && Number.isFinite(until) && until > Date.now();
			}).length;
			const poolAvailableCount = accounts.length - poolCoolingCount;
			const poolCreditSum = accounts.reduce((sum, account) => sum + (typeof poolCredits[account.id] === "number" && Number.isFinite(poolCredits[account.id]) ? poolCredits[account.id] : 0), 0);
			const poolCreditCapacity = accounts.reduce((sum, account) => sum + (typeof poolDetails[account.id]?.creditsTotal === "number" && Number.isFinite(poolDetails[account.id].creditsTotal) ? poolDetails[account.id].creditsTotal : 0), 0);
			/**
			* The readout under the pool summary: what this region's own model calls
			* did. A figure only appears once something measured it - the host ships
			* absent, not zero, for a stream that reported nothing.
			*/
			const poolCallLabel = typeof poolTotals.calls === "number" ? String(poolTotals.calls) : "—";
			const poolFirstTokenLabel = formatSidebarLatency(poolTotals.firstTokenMs) ?? "—";
			const poolSpeedLabel = formatSidebarSpeed(poolTotals.tokensPerSecond) ?? "—";
			const poolTokensLabel = formatSidebarTokens(poolTotals.totalTokens) ?? "—";
			const selectedPoolAccount = accounts.find((account) => account.selected === true) ?? accounts[0];
			const selectedPoolDetail = selectedPoolAccount === void 0 ? void 0 : poolDetails[selectedPoolAccount.id];
			const selectedPackages = Array.isArray(selectedPoolDetail?.packages) ? [...selectedPoolDetail.packages].sort((left, right) => (Number.isFinite(right?.size) ? right.size : 0) - (Number.isFinite(left?.size) ? left.size : 0)) : [];
			const accountName = typeof status?.accountName === "string" ? status.accountName : typeof status?.nickname === "string" ? status.nickname : void 0;
			const signedIn = status?.status === "signed-in";
			const group = groups.find((entry) => entry.id === provider);
			/**
			* The picker shows what this provider actually fetched, in the upstream's
			* order; the routable catalog is only a fallback for a provider whose
			* status document carried no model list.
			*/
			const models = Array.isArray(fetched) && fetched.length > 0 ? fetched : Array.isArray(group?.models) ? group.models : [];
			/**
			* Checked models lead the list, unchecked follow.
			*
			* `filter` preserves the incoming order, so this is a stable partition: a
			* model only moves when its own checked state changes, the relative order
			* inside each segment stays the provider's order, and repeated renders
			* cannot reshuffle rows. It applies to whichever list is on screen,
			* including the cached one painted before the async load resolves.
			*/
			const enabledSet = new Set(Array.isArray(enabledIds) ? enabledIds : []);
			const orderedModels = models.filter((model) => enabledSet.has(model?.id)).concat(models.filter((model) => !enabledSet.has(model?.id)));
			/**
			* Why this provider shows no models: its own catalog failure if the host
			* reported one, otherwise the generic empty note. Never a blank list.
			*/
			const providerFailure = Array.isArray(failures) ? failures.find((entry) => entry?.id === provider)?.message : void 0;
			/**
			* Credit text shown on the collapsed entry itself. The total leads, with the
			* check-in figure beside it when the provider has one; a missing number
			* renders nothing rather than a placeholder, so the entry never grows a
			* meaningless dash.
			*/
			/**
			* The collapsed entry carries the current provider's TOTAL credits only —
			* one number, never the check-in/total pair (that pair lives in the panel).
			* When the figure is unavailable the pill degrades to a muted dash rather
			* than vanishing, so the row never looks broken or blank.
			*/
			const railCredit = totalCredit === void 0 ? copy("creditUnknown") : String(totalCredit);
			const railCreditKnown = totalCredit !== void 0;
			const trigger = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "dsm-wb-side-trigger",
				"aria-expanded": open,
				"aria-label": railCredit === void 0 ? copy("entryTooltip") : `${copy("entryTooltip")} · ${copy("creditShort")} ${railCredit}`,
				title: railCredit === void 0 ? copy("entryTooltip") : `${copy("entryTooltip")} · ${copy("creditShort")} ${railCredit}`,
				onClick: () => setOpen((value) => !value),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						className: "dsm-wb-side-icon",
						src: WORKBUDDY_PLUGIN_ICON,
						alt: ""
					}),
					wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-trigger-label",
						children: copy("entry")
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-credit-badge",
						"data-unknown": railCreditKnown ? void 0 : "true",
						"data-busy": busy !== "" ? "true" : void 0,
						"aria-live": "polite",
						children: railCredit
					}),
					wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-chevron",
						"data-open": open ? "true" : void 0,
						children: "›"
					}) : null
				]
			});
			/**
			* One account overview followed by two detail cards. The provider,
			* credits, and pool blocks share one continuous surface instead of
			* reading as three unrelated cards. The model card owns a fixed grid
			* column, so it cannot inherit the full row width when space gets tight.
			*/
			/** The account-pool surface: provider, credits, pool, then the models column. */
			/** Which surface is showing: the account pool, or the usage readout. */
			const surfaceSwitch = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsm-wb-side-group dsm-wb-side-group-surfaces",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-workbuddy-tabs dsm-wb-side-tabs-inline",
					role: "tablist",
					children: [
						["pool", copy("tabPool")],
						["usage", copy("tabUsage")]
					].map(([id, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						className: tab === id ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
						"aria-selected": tab === id,
						/* remembering this keeps the user on 用量 across a remount too */
						onClick: () => {
							remember("tab", id);
							setTab(id);
						},
						children: label
					}, id))
				})
			});
			/**
			* The usage surface: the four headline figures, an hourly token chart, and
			* the three breakdown tables. Everything is a plain div/table - no chart
			* library - so it stays within the panel's existing dependency set.
			*/
			const usageBody = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-usage",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-group dsm-wb-side-group-usage",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-row",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsm-wb-side-label",
										children: copy("tabUsage")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsm-workbuddy-tabs dsm-wb-side-usage-ranges",
										children: [
											/* explicit keys: "all" must not be spelled "usageRangeall" */
											WORKBUDDY_USAGE_RANGES.map((range) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: usageRange === range ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
												"aria-pressed": usageRange === range,
												onClick: () => {
													remember("usageRange", range);
													setUsageRange(range);
												},
												children: copy(WORKBUDDY_USAGE_RANGE_LABELS[range])
											}, range)),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dsm-btn dsm-btn-outline",
												disabled: usageBusy,
												onClick: () => void loadUsageStats(usageRange),
												children: usageBusy ? copy("refreshing") : copy("usageRefresh")
											})
										]
									})
								]
							}),
							usageError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-error",
								role: "alert",
								children: usageError
							}),
							/**
							* Headline figures. Order is deliberate: the four volume numbers
							* first, then 缓存命中, then the derived cost figures, and 失败尝试
							* LAST - a failure count is a footnote to the traffic, not a
							* headline, and putting it mid-row made it read as if the whole
							* window had gone wrong.
							*/
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-usage-totals",
								children: [
									[copy("usageRequests"), formatUsageCount(usageStats.totals.calls), false],
									[copy("usageTotalTokens"), formatUsageCount(usageStats.totals.totalTokens), false],
									[copy("usagePrompt"), formatUsageCount(usageStats.totals.promptTokens), false],
									[copy("usageCompletion"), formatUsageCount(usageStats.totals.completionTokens), false],
									/* token count, not a percentage: the share moved around with the
									   window and told the user less than the raw amount did */
									[copy("usageCacheHitRate"), formatUsageCount(usageStats.totals.cacheHitTokens), false],
									[copy("usageAvgLatency"), formatUsageLatency(usageStats.totals.avgLatencyMs), false],
									/* the headline this round was asked for: measured from real bills */
									[copy("usageTokensPerCredit"), formatUsageTokensPerCredit(usageStats.totals.tokensPerCredit), false],
									[copy("usageCreditsSpent"), formatUsageCredits(usageStats.totals.credits), false],
									[copy("usageFailures"), formatUsageCount(usageStats.totals.failures), usageStats.totals.failures > 0]
								].map(([label, value, warn], index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: warn ? "dsm-wb-side-usage-total dsm-wb-side-usage-total-warn" : "dsm-wb-side-usage-total",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: value }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })
									]
								}, `${label}-${index}`))
							}),
							usageStats.series.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-empty",
								children: copy("usageEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-chart",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsm-wb-side-chart-legend",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-chart-prompt", children: copy("usagePrompt") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-chart-completion", children: copy("usageCompletion") })
										]
									}),
									/**
									* The plot: a gridline-and-tick chart, laid out like the reference.
									*
									* Y axis uses five ticks at max/4 steps so the top line IS the peak
									* bucket - a rounded ceiling would leave dead space above the tallest
									* column. Columns keep a fixed narrow width and are spread evenly,
									* so a sparse window reads as gaps rather than one solid block.
									*/
									/* @__PURE__ */ (() => {
										const peak = Math.max(...usageStats.series.map((point) => point.totalTokens), 1);
										const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(peak * share));
										const pad = (value) => String(value).padStart(2, "0");
										let previousDay = "";
										/**
										* Dense windows (a 14-day view can hold 336 hourly buckets) must
										* still fit the panel: the fixed 4px gap alone would total more
										* than the available width and push the whole page sideways
										* (measured: panel 1404px -> 2929px scrollWidth). So the gap
										* collapses when the series is dense, and the x-axis stops
										* labelling every single bucket.
										*/
										const dense = usageStats.series.length > 60;
										const labelEvery = Math.max(1, Math.ceil(usageStats.series.length / 12));
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-chart-plot",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-chart-axis",
													children: [...ticks].reverse().map((tick) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														children: formatUsageCount(tick)
													}, tick))
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-chart-area",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: "dsm-wb-side-chart-grid",
															"aria-hidden": "true",
															children: [...ticks].reverse().map((tick) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}, tick))
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: dense ? "dsm-wb-side-chart-cols dsm-wb-side-chart-cols-dense" : "dsm-wb-side-chart-cols",
															children: usageStats.series.map((point) => {
																const at = new Date(point.hour);
																const day = `${pad(at.getMonth() + 1)}/${pad(at.getDate())}`;
																/* the date is repeated only when the day changes, so a
																   multi-day window stays readable without clutter */
																const label = day === previousDay ? `${pad(at.getHours())}:00` : `${day} ${pad(at.getHours())}:00`;
																previousDay = day;
																const completionHeight = point.totalTokens === 0 ? 0 : point.completionTokens / point.totalTokens * 100;
																/* zero-token buckets get NO bar. The old Math.max(1, …) floor
																   drew a 2px stub that read as real traffic even though
																   nothing was billed that hour. */
																const barHeight = point.totalTokens === 0 ? 0 : Math.max(1, point.totalTokens / peak * 100);
																return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: "dsm-wb-side-chart-slot",
																	children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																		className: "dsm-wb-side-chart-bar",
																		style: { height: `${barHeight}%` },
																		title: `${label} · ${formatUsageCount(point.totalTokens)} · ${point.calls} ${copy("usageColRequests")}`,
																		children: [
																			/* completion sits on top, prompt fills the rest below */
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																				className: "dsm-wb-side-chart-seg dsm-wb-side-chart-seg-completion",
																				style: { height: `${completionHeight}%` }
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																				className: "dsm-wb-side-chart-seg dsm-wb-side-chart-seg-prompt",
																				style: { height: `${100 - completionHeight}%` }
																			})
																		]
																	})
																}, point.hour);
															})
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dsm-wb-side-chart-xaxis",
													"aria-hidden": "true",
													children: usageStats.series.map((point, index) => {
														const at = new Date(point.hour);
														/* Time only: "09/18 14:00" does not fit under a 34px column
														   and was being ellipsised to "09/18 ...". The date still
														   lives in each column's tooltip. */
														const isMidnight = at.getHours() === 0;
														/* dense windows label every Nth bucket (and always midnight, which
														   carries the date) so the ticks stay legible instead of
														   collapsing into a smear */
														const showLabel = !dense || isMidnight || index % labelEvery === 0;
														return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															children: showLabel ? isMidnight ? `${pad(at.getMonth() + 1)}/${pad(at.getDate())}` : `${pad(at.getHours())}:00` : ""
														}, point.hour);
													})
												})
											]
										});
									})()
								]
							})
						]
					}),
					/* the three breakdown tables share one renderer */
					...[
						[copy("usageByAccount"), usageStats.accounts, "accountId"],
						[copy("usageByModel"), usageStats.models, "model"],
						[copy("usageByRegion"), usageStats.regions, "region"]
					].map(([title, rows, key]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-group dsm-wb-side-group-usage-table",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-label",
								children: title
							}),
							rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-empty",
								children: copy("usageEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-usage-tablewrap",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
									className: "dsm-wb-side-usage-table",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", {
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
												children: [
													/* the realm table's first column IS the realm, so it must not
													   repeat it in a second column the way the others do */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: key === "model" ? copy("usageColModel") : key === "region" ? copy("usageColRealm") : copy("account") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColRequests") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColPrompt") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColCompletion") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColTotal") }),
													/* raw cached-token count, same change as the headline row */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageCacheHitRate") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColLatency") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColSpeed") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageTokensPerCredit") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageCreditsSpent") }),
													/* failures last: a footnote, not a headline */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColFailures") })
												]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", {
											children: rows.map((row, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: "dsm-wb-side-usage-name",
														title: row[key],
														children: row[key] === "" ? copy("acctUnknown") : row[key]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.calls) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.promptTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.completionTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.totalTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.cacheHitTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageLatency(row.avgLatencyMs) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageSpeed(row.avgTokensPerSecond) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageTokensPerCredit(row.tokensPerCredit) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCredits(row.credits) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { className: row.failures > 0 ? "dsm-wb-side-usage-warn" : void 0, children: row.failures === 0 ? "—" : formatUsageCount(row.failures) })
												]
											}, `${row[key]}-${index}`))
										})
									]
								})
							})
						]
					}, title))
				]
			});
			/** The account-pool surface: provider, credits, pool, then the model column. */
			const poolBody = [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-summary",
				children: [
			/* region switch: one compact row, not a card-sized empty block */
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsm-wb-side-group dsm-wb-side-group-provider",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-row",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsm-wb-side-label",
							children: copy("region")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-workbuddy-tabs dsm-wb-side-tabs-inline",
							children: WORKBUDDY_SIDEBAR_REGIONS.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: entry.id === region ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
								"aria-pressed": entry.id === region,
								disabled: busy !== "",
								onClick: () => {
									/* remember the pick: a remount must not snap back to 国内版 */
									remember("region", entry.id);
									setRegion(entry.id);
								},
								children: entry.label
							}, entry.id))
						})
					]
				})
			}),
				/* account + rescan */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-credits",
					children: [
						/* credits header: refresh, and the name-visibility switch */
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-label",
									children: copy("poolCreditsLabel")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-actions",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: "dsm-wb-switch",
											title: copy("hideNames"),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: hideNames,
													onChange: (event) => {
														const next = event.target.checked;
														setHideNames(next);
														try {
															window.localStorage.setItem(NAMES_HIDDEN_KEY, next ? "1" : "0");
														} catch {}
													}
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													children: copy("hideNames")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline",
											disabled: busy !== "",
											onClick: refreshCredits,
											children: busy === "credits" ? copy("refreshingCredits") : copy("refreshCredits")
										})
									]
								})
							]
						}),
						creditsError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: `${copy("creditsFailed")}: ${creditsError}`
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-account",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-account-copy",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dsm-wb-side-account-name",
											/* the same name-visibility switch the pool rows honour:
											   hiding names must hide THIS one too, not just the rows */
											children: hideNames ? copy("nameHidden") : accountName ?? (signedIn ? copy("signedIn") : copy("signedOut"))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-account-state",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-dot",
													"data-state": signedIn ? "ok" : "off"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													children: signedIn ? copy("signedIn") : copy("signedOut")
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsm-btn dsm-btn-outline",
									disabled: busy !== "",
									onClick: rescan,
									children: busy === "rescan" ? copy("rescanning") : copy("rescan")
								})
							]
						}),
						/* credits */
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-credits",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-credit",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-wb-side-credit-label",
											children: copy("checkinCredit")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											className: "dsm-wb-side-credit-value",
											children: checkinCredit === void 0 ? "—" : String(checkinCredit)
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-credit",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-wb-side-credit-label",
											children: copy("totalCredit")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											className: "dsm-wb-side-credit-value",
											children: totalCredit === void 0 ? "—" : String(totalCredit)
										})
									]
								})
							]
						}),
						/* check-in (CN only) */
						!supportsCheckin ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsm-btn dsm-btn-primary dsm-wb-side-block",
							disabled: busy !== "" || !signedIn,
							onClick: checkin,
							children: busy === "checkin" ? copy("checkingIn") : checkinState?.todayCheckedIn === true ? copy("checkinDone") : copy("checkin")
						})
					]
				}),
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-pool",
				children: [
				/* account pool: one row per account, current one marked */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-pool",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-label",
									children: [copy("pool"), " ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dsm-wb-side-count",
										children: [String(accounts.length), copy("poolUnit")]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-actions",
									children: [
										!supportsCheckin ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline dsm-wb-side-checkall",
											disabled: busy !== "" || checkinAllBusy || poolAllCheckedIn || accounts.length === 0,
											title: copy("checkinAll"),
											onClick: () => checkinPool(),
											children: checkinAllBusy ? copy("checkinAllBusy") : poolAllCheckedIn ? copy("checkinAllDone") : copy("checkinAll")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline dsm-wb-side-add",
											"aria-expanded": addOpen,
											disabled: busy !== "",
											onClick: () => {
												if (addOpen) closeAdd();
												else openAdd();
											},
											children: copy("addAccount")
										}),
									]
								})
							]
						}),
						!signedIn && accounts.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-pool-summary",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatAccounts") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(accounts.length) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatAvailable") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(poolAvailableCount) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatCooling") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(poolCoolingCount) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat dsm-wb-side-pool-stat-credits",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("creditShort") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											children: poolCreditCapacity > 0 ? `${formatSidebarCredits(poolCreditSum)} / ${formatSidebarCredits(poolCreditCapacity)}` : formatSidebarCredits(poolCreditSum)
										})
									]
								})
							]
						}),
						!signedIn && accounts.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-pool-metrics",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatCalls") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolCallLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatFirstToken") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolFirstTokenLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatSpeed") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolSpeedLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatTokens") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolTokensLabel })
									]
								})
							]
						}),
						!addOpen ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-addform",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-addhint",
									children: copy("addHint")
								}),
								addPhase === "idle" || addPhase === "starting" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-addrow",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-primary",
											disabled: addPhase === "starting",
											onClick: startAdd,
											children: addPhase === "starting" ? copy("addStarting") : copy("addStart")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline",
											disabled: addPhase === "starting",
											onClick: closeAdd,
											children: copy("addCancel")
										})
									]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-addlink",
									children: [
										/* the raw URL stays selectable, so a blocked popup is recoverable */
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: "dsm-wb-side-addurl",
											title: addLink,
											children: addLink
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-addrow",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-primary",
													onClick: openAddLink,
													children: copy("addOpen")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline",
													onClick: copyAddLink,
													children: addCopied ? copy("addCopied") : copy("addCopy")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline",
													onClick: closeAdd,
													children: addPhase === "done" ? copy("addClose") : copy("addCancel")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: addPhase === "done" ? "dsm-wb-side-addstatus dsm-wb-side-addstatus-on" : "dsm-wb-side-addstatus",
											children: addPhase === "done" ? `${copy("addDone")}${addName === void 0 ? "" : ` · ${addName}`}` : copy("addWaiting")
										})
									]
								}),
								addError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-adderr",
									role: "alert",
									children: addError
								})
							]
						}),
						accounts.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: signedIn ? copy("poolEmpty") : copy("signedOut")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-accounts",
							children: accounts.map((account) => {
								const isCurrent = account.selected === true;
								const meta = [account.domain, !hideNames && typeof account.id === "string" ? account.id.slice(0, 8) : void 0].filter((part) => typeof part === "string" && part !== "").join(" \u00b7 ");
								const health = poolHealth[account.id];
								const coolingUntil = formatSidebarCooling(health?.until);
								const cooling = coolingUntil !== void 0;
								const modelLimited = Object.values(poolModelHealth[account.id] ?? {}).some((entry) => typeof entry?.until === "number" && Number.isFinite(entry.until) && entry.until > Date.now());
								const checkedInToday = poolCheckin[account.id]?.todayCheckedIn === true;
								const stats = poolStats[account.id];
								const completedCalls = (stats?.successes ?? 0) + (stats?.failures ?? 0);
								const successRate = completedCalls === 0 ? void 0 : Math.round((stats?.successes ?? 0) / completedCalls * 100);
								const inFlight = stats?.inFlight ?? 0;
								const lastSuccess = formatSidebarLastSuccess(stats?.lastSuccessAt);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: `dsm-wb-side-acct${isCurrent ? " dsm-wb-side-acct-on" : ""}${cooling ? " dsm-wb-side-acct-cool" : ""}`,
									"data-current": isCurrent ? "true" : void 0,
									"data-cooling": cooling ? "true" : void 0,
									"data-model-limited": modelLimited ? "true" : void 0,
									children: [
										/* the row is a container, not a button: an account needs its own
										   check-in control, and a button inside a button is invalid HTML */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "dsm-wb-side-acct-pick",
											"aria-pressed": isCurrent,
											disabled: busy !== "",
											title: isCurrent ? copy("acctCurrent") : copy("acctUse"),
											onClick: () => switchAccount(account.id),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-acct-mark",
													"aria-hidden": "true",
													children: isCurrent ? "\u2713" : ""
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-acct-copy",
													children: [
														hideNames ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-name",
															children: account.accountName ?? account.id ?? copy("acctUnknown")
														}),
														meta === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-meta",
															children: meta
														}),
														/* Live model-call health stays on the account row, where the
														   user makes the switching decision. */
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "dsm-wb-side-acct-metrics",
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: `${copy("acctSuccess")} ${successRate === void 0 ? "—" : `${successRate}%`}`
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: completedCalls === 0 ? copy("acctNoCalls") : `${completedCalls} ${copy("acctCalls")}`
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: `${copy("acctLastSuccess")} ${lastSuccess ?? "—"}`
																})
															]
														}),
														cooling ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "dsm-wb-side-acct-cooling",
															title: typeof health?.reason === "string" ? health.reason : copy("coolingHint"),
															children: [
																health?.kind === "credit" ? copy("totalCredit") : "",
																copy("coolingUntil"),
																" ",
																coolingUntil
															]
														}) : null
													]
												})
											]
										}),
										/* controls sit on their own line when the card is narrow,
										   instead of squeezing the account name to a stub */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsm-wb-side-acct-side",
											children: [
												inFlight === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-status dsm-wb-side-status-live",
													children: [copy("acctInFlight"), " ", String(inFlight)]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: cooling ? "dsm-wb-side-status dsm-wb-side-status-cool" : modelLimited ? "dsm-wb-side-status dsm-wb-side-status-model" : "dsm-wb-side-status",
													children: cooling ? copy("poolHealthCooling") : modelLimited ? copy("poolHealthModelLimited") : copy("poolHealthOk")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-acct-credits",
													/* remaining over the account's own capacity: the same pair the
													   pool summary shows, so the two readouts agree */
													children: poolAccountCreditsLabel(poolCredits[account.id], poolDetails[account.id]?.creditsTotal),
													"data-credits": typeof poolCredits[account.id] === "number" ? String(poolCredits[account.id]) : void 0
												}),
												!supportsCheckin ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline dsm-wb-side-acct-check",
													disabled: busy !== "" || checkinOneBusy !== "" || checkedInToday,
													onClick: () => checkinPool(account.id),
													children: checkinOneBusy === account.id ? copy("checkinOneBusy") : checkedInToday ? copy("checkinOneDone") : copy("checkinOne")
												})
											]
										})
									]
								}, account.id);
							})
						}),
						selectedPackages.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
							className: "dsm-wb-side-packages",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolPackages") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-packages-count", children: String(selectedPackages.length) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsm-wb-side-packages-list",
									children: selectedPackages.map((pack, index) => {
										const expires = formatSidebarPackageDate(pack?.expiresAtMs);
										const cycle = formatSidebarPackageDate(pack?.cycleRefreshMs);
										const dateLabel = cycle === void 0 ? expires === void 0 ? void 0 : `${copy("packageExpires")} ${expires}` : `${copy("packageCycle")} ${cycle}`;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-package",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-package-copy",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-package-name",
															title: typeof pack?.packageName === "string" ? pack.packageName : void 0,
															children: typeof pack?.packageName === "string" && pack.packageName !== "" ? pack.packageName : copy("creditUnknown")
														}),
														dateLabel === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-package-date", children: dateLabel })
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-package-amount",
													children: [
														formatSidebarCredits(typeof pack?.remain === "number" ? pack.remain : void 0),
														" / ",
														formatSidebarCredits(typeof pack?.size === "number" ? pack.size : void 0)
													]
												})
											]
										}, `${pack?.packageName ?? "package"}-${index}`);
									})
								})
							]
						})
					]
				}),
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-models",
				children: [
				/* models */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-models",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-label",
									children: copy("model")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsm-btn dsm-btn-outline",
									disabled: busy !== "",
									onClick: refreshModels,
									children: busy === "models" ? copy("refreshing") : copy("refreshModels")
								})
							]
						}),
						models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: providerFailure ?? copy("modelEmpty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-models",
							children: orderedModels.map((model) => {
								const isEnabled = enabledSet.has(model.id);
								const isActive = selected?.provider === provider && selected.model === model.id;
								const hasImage = (Array.isArray(imageIds) ? imageIds : []).includes(model.id);
								const native = typeof model.nativeContextWindow === "number" ? model.nativeContextWindow : model.contextWindow;
								const budget = contextBudgets[model.id] ?? 2e5;
								const busyNow = busy !== "";
								const reasoningTag = reasoningTagOf(model);
								const reasoningDefault = reasoningDefaultOf(model);
								const modelHealth = selectedPoolAccount === void 0 ? void 0 : poolModelHealth[selectedPoolAccount.id]?.[model.id];
								const modelLimitUntil = formatSidebarCooling(modelHealth?.until);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: isEnabled ? "dsm-wb-side-model dsm-wb-side-model-on" : "dsm-wb-side-model",
									"data-active": isActive ? "true" : void 0,
									children: [
										/* row head: enable checkbox + name */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: "dsm-wb-side-model-enabled",
											title: isEnabled ? copy("modelEnabledHint") : copy("modelEnable"),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: isEnabled,
													disabled: busyNow,
													onChange: () => toggleModel(model.id)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-name",
													children: model.name ?? model.id
												}),
												multiplierLabelOf(model) === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-rate",
													children: multiplierLabelOf(model)
												}),
												modelLimitUntil === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-limit",
													children: copy("poolHealthModelLimited")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-model-controls",
											children: [
												/* image switch, per provider */
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: "dsm-wb-side-model-image",
													title: copy("modelImage"),
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: hasImage,
															disabled: busyNow,
															onChange: () => toggleImage(model.id)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															children: copy("modelImage")
														})
													]
												}),
												/* context budget pair, same rule as the card */
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
													className: "dsm-wb-side-context",
													"aria-label": copy("contextBudget"),
													children: [
														native > 2e5 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "radio",
																	name: `ctx-${region}-${model.id}`,
																	checked: budget === 2e5,
																	disabled: busyNow,
																	onChange: () => setContextBudget(model.id, 2e5)
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: copy("context200k")
																})
															]
														}) : null,
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "radio",
																	name: `ctx-${region}-${model.id}`,
																	checked: !(native > 2e5) || budget === native,
																	disabled: busyNow || !(native > 2e5),
																	onChange: () => setContextBudget(model.id, native)
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: formatSidebarCapacity(native)
																})
															]
														})
													]
												}),
												/* activating one enabled model stays explicit */
												isEnabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: isActive ? "dsm-wb-side-model-use dsm-wb-side-model-use-on" : "dsm-wb-side-model-use",
													disabled: busyNow || isActive,
													title: copy("modelUse"),
													onClick: () => activateModel(model.id),
													children: isActive ? "✓" : copy("modelUse")
												}) : null
											]
										}),
										/* Default effort, supported efforts, and output cap stay
										   with the model they describe, on one wrapping line. */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-model-meta",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelDefault"), " ", reasoningDefault ?? "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelEfforts"), " ", reasoningTag ?? "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelContext"), " ", typeof model.nativeContextWindow === "number" && Number.isFinite(model.nativeContextWindow) ? formatSidebarCapacity(model.nativeContextWindow) : "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelOutput"), " ", typeof model.maxTokens === "number" && Number.isFinite(model.maxTokens) ? formatSidebarCapacity(model.maxTokens) : "—"]
												}),
												modelLimitUntil === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-model-limit-time",
													title: typeof modelHealth?.reason === "string" ? modelHealth.reason : copy("modelLimitHint"),
													children: [copy("modelLimitUntil"), " ", modelLimitUntil]
												})
											]
										})
									]
								}, model.id);
							})
						})
					]
				}),
				]
			}),
				error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-wb-side-error",
					role: "alert",
					children: error
				})
			];
			/** The visible surface: the pool, or the usage readout. */
			const body = [
				/* keyed by surface so React remounts rather than reconciling two
				   different trees into each other when the tab flips */
				tab === "usage" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					key: "usage",
					className: "dsm-wb-side-body-usage-slot",
					children: usageBody
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					key: "pool",
					className: "dsm-wb-side-body-pool-slot",
					children: poolBody
				})
			];
			if (!open && !isView) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkBuddySidebarBoundary, {
					label: copy("panelFailed"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: layerRef,
						className: wide ? "dsm-wb-side-layer" : "dsm-wb-side-layer dsm-wb-side-rail",
						children: trigger
					})
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: layerRef,
				className: isView ? "dsm-wb-view-root" : wide ? "dsm-wb-side-layer" : "dsm-wb-side-layer dsm-wb-side-rail",
				children: [isView ? null : trigger, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: isView ? "dsm-wb-side-panel dsm-wb-view-panel" : "dsm-wb-side-panel",
					role: "dialog",
					"aria-label": copy("title"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							className: "dsm-wb-side-icon",
							src: WORKBUDDY_PLUGIN_ICON,
							alt: ""
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsm-wb-side-title",
							children: copy("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsm-wb-side-collapse",
							title: copy("collapse"),
							"aria-label": copy("collapse"),
							onClick: () => setOpen(false),
							hidden: isView,
							children: "×"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkBuddySidebarBoundary, {
						label: copy("panelFailed"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-main",
							children: [
								/* the surface switch sits above the page grid: inside it, the
								   pool's own grid-row placement would fight the extra row */
								surfaceSwitch,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: tab === "usage" ? "dsm-wb-side-body dsm-wb-side-body-usage" : "dsm-wb-side-body",
									children: body
								})
							]
						})
					})]
				})]
			});
		}
		/**
		* The same panel, rendered as a main-area view instead of the sidebar popover.
		* It is the identical component with `mode: "view"`: no trigger, always
		* expanded, sizing left to the view slot. One implementation, two shells -
		* so nothing can drift between them.
		*/
		function WorkBuddyView(props) {
			return react.createElement(WorkBuddySidebar, Object.assign({}, props, {
				mode: "view",
				wide: true
			}));
		}
		//#endregion
		//#region src/client/index.tsx
		/** Stable browser-plugin name. */
		const name = "dsh-connect-workbuddy-client";
		/** Client services required by the Plugin configuration contribution. */
		const inject = [
			"slots",
			"locale",
			"settingsScope"
		];
		/** Register card copy and the WorkBuddy card under Plugin configuration. */
		function apply(ctx) {
			try {
				const namespace = "settings.workbuddy";
				ctx.effect(() => ctx.locale.register(namespace, {
					zh,
					en
				}), "dsh-connect-workbuddy: settings copy");
				const t = ctx.locale.bind(namespace);
				const settingsScope = ctx.settingsScope.bind({ namespace: "workbuddy" });
				ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
					name: "settings.plugin.item",
					key: "workbuddy",
					priority: 30,
					inject: () => ({
						t,
						settingsScope
					})
				}, WorkBuddyCard));
				ctx.effect(() => ctx.locale.register("sidebar.workbuddy", {
					zh: WORKBUDDY_SIDEBAR_ZH,
					en: WORKBUDDY_SIDEBAR_EN
				}), "dsh-connect-workbuddy: sidebar copy");
				const sidebarT = ctx.locale.bind("sidebar.workbuddy");
				ctx.slots.inject("conversation.view", () => ctx.slots.register({
					name: "conversation.view",
					id: "sb-workbuddy-view",
					label: "WorkBuddy",
					locale: "sidebar.workbuddy",
					order: 30,
					inject: () => ({
						t: sidebarT,
						modelDirectories: ctx.get("modelDirectories"),
						settingsScope: ctx.settingsScope?.bind?.({ namespace: "workbuddy" })
					})
				}, WorkBuddyView));
			} catch (error) {
				console.error("[dsh-connect-workbuddy] client card failed to load (host provider unaffected):", error);
			}
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
