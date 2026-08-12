export default function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { shoeData, baseUnit } = req.body;
    
    // 40組核心演算法與注碼
    const patterns = [
        { p: "1221121", bet: "11112122" }, { p: "1221122", bet: "22221211" },
        { p: "2112212", bet: "22221211" }, { p: "2112211", bet: "11112122" },
        { p: "1221112", bet: "11212221" }, { p: "1221111", bet: "22121112" },
        { p: "2112221", bet: "22121112" }, { p: "2112222", bet: "11212221" },
        { p: "1112111", bet: "11222221" }, { p: "1112112", bet: "22111112" },
        { p: "2221222", bet: "22111112" }, { p: "2221221", bet: "11222221" },
        { p: "1112212", bet: "11121211" }, { p: "1112211", bet: "22212122" },
        { p: "2221121", bet: "22212122" }, { p: "2221122", bet: "11121211" },
        { p: "1221221", bet: "21122122" }, { p: "1221222", bet: "12211211" },
        { p: "2112112", bet: "12211211" }, { p: "2112111", bet: "21122122" },
        { p: "1122112", bet: "11212221" }, { p: "1122111", bet: "22121112" },
        { p: "2211221", bet: "22121112" }, { p: "2211222", bet: "11212221" },
        { p: "1212222", bet: "22121112" }, { p: "1212221", bet: "11212221" },
        { p: "2121111", bet: "11212221" }, { p: "2121112", bet: "22121112" },
        { p: "1121221", bet: "21222122" }, { p: "1121222", bet: "12111211" },
        { p: "2212112", bet: "12111211" }, { p: "2212111", bet: "21222122" },
        { p: "1211212", bet: "22111221" }, { p: "1211211", bet: "11222112" },
        { p: "2122121", bet: "11222112" }, { p: "2122122", bet: "22111221" },
        { p: "1122211", bet: "21121211" }, { p: "1122212", bet: "12212122" },
        { p: "2211122", bet: "12212122" }, { p: "2211121", bet: "21121211" }
    ];

    const martingaleMultipliers = [1, 2, 4, 8, 16, 32, 64, 128];
    let state = "WARMUP";
    let step = 0;
    let currentPattern = null;
    let netProfit = 0;
    let logMsg = "";
    let logType = "";

    for (let t = 1; t <= shoeData.length; t++) {
        let actual = shoeData[t - 1];
        
        if (state === "ATTACKING") {
            let target = parseInt(currentPattern.bet[step]);
            // 【修改點】支援小數點注碼與精準計算
            let betAmount = Number((baseUnit * martingaleMultipliers[step]).toFixed(2));
            let expectedWin = target === 2 ? Number((betAmount * 0.95).toFixed(2)) : betAmount;

            if (actual === target) {
                netProfit = Number((netProfit + expectedWin).toFixed(2));
                if (t === shoeData.length) { logMsg = `🎉 第 ${step + 1} 注命中！獲利 $${expectedWin}。返回掃描模式。`; logType = "success"; }
                state = t >= 11 ? "SCANNING" : "WARMUP";
            } else {
                netProfit = Number((netProfit - betAmount).toFixed(2));
                if (t === shoeData.length) { logMsg = `⚠️ 第 ${step + 1} 注未中 (損失 $${betAmount})。`; logType = "error"; }
                step++;
                if (step >= 8) {
                    if (t === shoeData.length) { logMsg = `🚨 八纜斷裂！請嚴格執行止損。返回掃描模式。`; logType = "error"; }
                    state = t >= 11 ? "SCANNING" : "WARMUP";
                }
            }
            continue;
        }

        if (t >= 50 && state !== "ATTACKING") {
             state = "STOPPED";
             if(t === shoeData.length) { logMsg = "🛑 已達50局 (停止掃描)"; logType = "info"; }
             continue;
        }

        if (state === "WARMUP" || state === "SCANNING") {
            if (t >= 11) {
                state = "SCANNING";
                if (t >= 7) {
                    let histStr = shoeData.slice(t - 7, t).join("");
                    let found = false;
                    for (let pat of patterns) {
                        if (histStr === pat.p) {
                            if (t >= 10) {
                                let filterStr = pat.p.charAt(0) === '1' ? '212' : '121';
                                let histCheckStr = shoeData.slice(t - 10, t - 7).join("");
                                if (histCheckStr === filterStr) continue;
                            }
                            currentPattern = pat; found = true; break;
                        }
                    }
                    if (found) {
                        state = "ATTACKING"; step = 0;
                        if (t === shoeData.length) { logMsg = `🔥 獵手演算法鎖定目標！開始執行八纜攻擊。`; logType = "alert"; }
                    }
                }
            } else { state = "WARMUP"; }
        }
    }
    
    let nextTarget = null;
    let nextBetAmount = 0;
    if (state === "ATTACKING" && currentPattern) {
        nextTarget = currentPattern.bet[step];
        nextBetAmount = Number((baseUnit * martingaleMultipliers[step]).toFixed(2));
    }

    res.status(200).json({ state, step, target: nextTarget, betAmount: nextBetAmount, netProfit, logMsg, logType });
}
