
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runSeleniumTest() {
    const remoteUrl = process.env.SELENIUM_REMOTE_URL;
    const appUrl = process.env.APP_URL || 'http://localhost:3001';

    const options = new chrome.Options();

    if (remoteUrl) {
        // Jenkins: use remote Chromium browser
        options.addArguments(
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        );
    } else {
        // Mac: use locally installed Google Chrome
        options.setChromeBinaryPath(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        );
    }

    let builder = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options);

    if (remoteUrl) {
        builder = builder.usingServer(remoteUrl);
    }

    const driver = await builder.build();

    try {
        console.log('Opening Online Library application...');

        await driver.get(appUrl);

        await driver.wait(
            until.elementLocated(By.id('loginForm')),
            15000
        );

        await driver.wait(async () => {
            const connection = await driver
                .findElement(By.id('connection'))
                .getText();

            return connection === 'Database connected';
        }, 20000);

        console.log('PASS: Application and database loaded');

        // Admin login
        const username = await driver.findElement(
            By.name('username')
        );

        const password = await driver.findElement(
            By.name('password')
        );

        await username.clear();
        await username.sendKeys('admin');

        await password.clear();
        await password.sendKeys('admin123');

        await driver.findElement(
            By.css('#loginForm button')
        ).click();

        await driver.wait(
            until.elementIsVisible(
                driver.findElement(By.id('app'))
            ),
            10000
        );

        console.log('PASS: Admin login successful');

        // Books tab
        await driver.wait(
            until.elementIsVisible(
                driver.findElement(By.id('books'))
            ),
            5000
        );

        console.log('PASS: Books tab opened');

        // Students tab
        await driver.findElement(
            By.css('nav button[data-tab="students"]')
        ).click();

        await driver.wait(
            until.elementIsVisible(
                driver.findElement(By.id('students'))
            ),
            5000
        );

        console.log('PASS: Students tab opened');

        // Issue / Return tab
        await driver.findElement(
            By.css('nav button[data-tab="loans"]')
        ).click();

        await driver.wait(
            until.elementIsVisible(
                driver.findElement(By.id('loans'))
            ),
            5000
        );

        console.log('PASS: Issue / Return tab opened');

        console.log('SELENIUM TESTS PASSED');

    } catch (error) {
        console.error('SELENIUM TEST FAILED:', error);
        process.exitCode = 1;

    } finally {
        await driver.quit();
    }
}

runSeleniumTest().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
