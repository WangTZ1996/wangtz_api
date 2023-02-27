const puppeteer = require('puppeteer')

const fetchBlog = async (url) => {

    const broswer = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        ignoreDefaultArgs: [
            '--enable-automation',
            '--single-process',
            '--no-sandbox',
            '--enable-blink-features=IdleDetection'
        ],
        args: [
            '--start-maximized', 
            '--disable-infobars', 
            '-no-default-browser-check',
            '--start-fullscreen',
            '--enable-experimental-fullscreen-exit-ui',
            '--user-agent=Mozilla/5.0......',
        ]
    })
    const [ page ] = await broswer.pages()

    await page.goto(url)

    const pageHeader = await page.evaluate(() => {
        let title = document.head.getElementsByTagName('title')[0].innerText
        let metaArr = document.head.getElementsByTagName('meta')

        let description;
        let keywords;

        Array.from(metaArr).forEach((data) => {
            switch(data.name) {
                case 'description':
                    description = data.content;
                    break;
                case 'keywords':
                    keywords = data.content
                    break;
            }
        })

        return JSON.parse(JSON.stringify({
            title,
            description,
            keywords,
            source: 'crawler'
        }));
    })

    console.log(pageHeader, 'pageHeader')

    return pageHeader
}

module.exports = fetchBlog

// fetchBlog('https://blog.csdn.net/weixin_44955769/article/details/114690661')
// fetchBlog('https://blog.csdn.net/xiegongmiao/article/details/103183052')
// fetchBlog('https://blog.51cto.com/u_15127641/2874133')
// fetchBlog('https://blog.csdn.net/m0_66557301/article/details/126540504')
// fetchBlog('https://blog.csdn.net/qq_44423029/article/details/127377327')
// fetchBlog('https://blog.csdn.net/weixin_47375788/article/details/126408703')
// fetchBlog('https://www.jianshu.com/p/890bc725add5')
