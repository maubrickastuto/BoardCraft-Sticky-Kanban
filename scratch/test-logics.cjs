const CDP = require('chrome-remote-interface');

async function test() {
    let client;
    try {
        client = await CDP({ port: 9222 });
        const { Runtime } = client;

        Runtime.consoleAPICalled(({ type, args }) => {
            console.log(`[CONSOLE ${type}]`, args.map(a => a.value || a.description).join(' '));
        });
        Runtime.exceptionThrown(({ exceptionDetails }) => {
            console.log(`[EXCEPTION]`, exceptionDetails);
        });

        await Runtime.enable();
        
        console.log("Evaluating tests...");
        const result = await Runtime.evaluate({
            expression: `
                (function() {
                    let errors = [];
                    try {
                        localStorage.setItem('test', '123');
                        if (localStorage.getItem('test') !== '123') errors.push("localStorage not persisting");
                    } catch (e) {
                        errors.push("localStorage error: " + e.message);
                    }
                    
                    return {
                        errors: errors,
                        url: window.location.href,
                        bodyText: document.body.innerText.substring(0, 100)
                    };
                })()
            `,
            returnByValue: true
        });
        console.log("Evaluation result:", result.result.value);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}
test();
