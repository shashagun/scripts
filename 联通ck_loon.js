/*
 * @name: 联通Token获取 (Loon版)
 * @description: 捕获联通App的token_online，并点击通知后自动复制到剪贴板。
 * @author: Gemini
 * @version: 3.0.0 (使用通知内置剪贴板功能)
 */

// ###############################
// ######     脚本主逻辑     ######
// ###############################

// 本脚本核心逻辑为通过通知内置功能实现复制到剪贴板
const $ = new Env();
const targetUrl = 'https://m.client.10010.com/mobileService/onLine.htm';

(async () => {
    if ($request.url.includes(targetUrl)) {
        $.log('ℹ️ 捕获到目标URL: ' + $request.url);

        try {
            const body = JSON.parse($response.body);
            const token_online = body?.token_online;
            
            if (!token_online) {
                const errorMsg = '❌ 未在响应体中找到 token_online，请检查是否登录或响应格式。';
                $.log(errorMsg);
                $.notify('联通Token获取失败', '', errorMsg);
                return $.done();
            }
            
            $.log(`✅ 成功获取 token_online: ${token_online} `);

            // 使用通知内置的“点击复制”功能
            const successMsg = '✅ 联通Token已获取，点击此通知即可复制！';
            $.log(successMsg);
            
            // 将token_online作为剪贴板内容传入通知的第四个参数
            $.notify('联通Token获取成功', '', successMsg, token_online);

        } catch (jsonParseError) {
            // 这个catch块只处理JSON解析失败的情况
            const errorMsg = '❌ 响应体解析失败。';
            $.log(errorMsg);
            $.logErr(jsonParseError);
            $.notify('联通Token获取失败', '', errorMsg);
        }
    }
})().catch((e) => {
    $.logErr(e);
}).finally(() => {
    $.done();
});


// 兼容多环境的 Env 类 (已为Loon优化)
// [v3.0 简化版] 移除了$clipboard相关逻辑
function Env() {
    const isLoon = typeof $loon !== 'undefined';

    // 这是一个通用的网络请求封装，Loon的实现放到了这里
    const wrapPromise = (options, method) => {
        return new Promise((resolve, reject) => {
            // 根据方法选择对应的 Loon httpClient
            const httpClientMethod = method === 'POST' ? $httpClient.post : (method === 'PUT' ? $httpClient.put : $httpClient.get);
            httpClientMethod(options, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    // 返回一个与QuanX等工具兼容的响应对象
                    resolve({ body, status: resp.statusCode, headers: resp.headers });
                }
            });
        });
    };

    const http = {
        get: (options) => wrapPromise(options, 'GET'),
        post: (options) => {
            if (typeof options.body === 'object' && options.body !== null) {
                options.headers['Content-Type'] = 'application/json;charset=UTF-8';
                options.body = JSON.stringify(options.body);
            }
            return wrapPromise(options, 'POST');
        },
        put: (options) => {
            if (typeof options.body === 'object' && options.body !== null) {
                options.headers['Content-Type'] = 'application/json;charset=UTF-8';
                options.body = JSON.stringify(options.body);
            }
            return wrapPromise(options, 'PUT');
        }
    };
    
    // 适配 Loon 的通知功能，第四个参数为剪贴板内容
    const notify = (title, subtitle = '', body = '', clipboardContent = '') => {
        if (isLoon) {
            const attachment = {
                "clipboard": clipboardContent
            };
            $notification.post(title, subtitle, body, attachment);
        } else {
            // 非Loon环境下打印日志
            console.log(`${title}\n${subtitle}\n${body}\n[剪贴板内容]: ${clipboardContent}`);
        }
    };

    const log = (msg) => console.log(msg);
    const logErr = (e) => console.log(e.stack || e);
    const done = (value = {}) => isLoon ? $done(value) : null;
    
    return { http, notify, log, logErr, done };
}