<template>
    <div>
        <el-container>
            <el-aside>
                <el-form label-width="80px" :model="selInfo">
                    <el-form-item label="预定日期">
                        <el-input v-model="selInfo.date"></el-input>
                        <span style="color:red; font-size:12px">(需要是YYYY-MM-DD格式)</span>
                    </el-form-item>
                    <el-form-item label="手机号">
                        <el-input v-model="selInfo.phone"></el-input>
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input v-model="selInfo.pass"></el-input>
                    </el-form-item>
                    <el-form-item label="验证码">
                        <el-input v-model="selInfo.verifyCode"></el-input>
                    </el-form-item>
                    <el-form-item label="key">
                        <el-input type="textarea" :autosize="{ minRows: 4, maxRows: 6}" v-model="selInfo.key"></el-input>
                    </el-form-item>
                </el-form>
                <div style="margin-left:100px;margin-top:40px">
                    <el-button @click="startFn" type="primary">开始</el-button>
                    <el-button @click="endFn" type="danger">停止</el-button>
                </div>
            </el-aside>
        </el-container>
    </div>
</template>
<script>
const dayjs = require('dayjs')
const {remote} = require('electron')
const puppeteer = require('puppeteer')
const cronJob = require('cron').CronJob
let page = null
let browser = null

const timeRange = ['16:00', '19:00']

const targetTime = (t) => {
    const timeArr = ['5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
    const sInd = timeArr.indexOf('16:00')
    const eInd = timeArr.indexOf('19:00')
    const choose = timeArr.slice(sInd, eInd)
    let res = []
    for (let i = 0; i < choose.length - 1; i++) {
        res.push(`${choose[i]}-${choose[i+1]}`)
    }
    return res
}

// 用户信息
// const selInfo = {
//     base_url: 'http://www.quyundong.com',
//     phone: '17621197159',
//     pass: 'nishibushisa11',
//     verifyCode: 'bbw8',
//     key: 's%3AQce3nYlkjRu4fRFB8Q49XK68R6J6lNnl.BNG0fGAUlWGRoC62VSzFicF5lU%2BzvZvu2H0t7lKLdSs',
//     tr: targetTime(),
//     city_id: 321,
//     cat_id: '', // 种类
//     region_id: '', // 区域
//     random: Math.random()
// }
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    name: "ss",
    data() {
        return {
            retryJob: '',
            selInfo: {
                base_url: 'http://www.quyundong.com',
                date: '',
                phone: '17621197159',
                pass: 'nishibushisa11',
                verifyCode: 'bbw8',
                key: 's%3AQce3nYlkjRu4fRFB8Q49XK68R6J6lNnl.BNG0fGAUlWGRoC62VSzFicF5lU%2BzvZvu2H0t7lKLdSs',
                tr: targetTime(),
                city_id: 321,
                cat_id: '', // 种类
                region_id: '', // 区域
                random: Math.random()
            },
            run: false
        }
    },
    created () {
        if (dayjs().isBefore(dayjs(`${dayjs().format('YYYY-MM-DD')} 12:00:00`))) {
            this.selInfo.date = dayjs().startOf('day').add(6, 'day').format('YYYY-MM-DD')
        } else {
            this.selInfo.date = dayjs().startOf('day').add(7, 'day').format('YYYY-MM-DD')
        }
    },
    methods: {
        endFn () {
            if (this.retryJob) {
                this.retryJob.stop()
            }
            console.info('重试即将停止...')
            setTimeout(() => {
                console.info('重试已经停止...')
            }, 5000)
        },
        async startFn() {
            // 到2020-07-25 00:00:00,程序失效
            if (dayjs().unix() > 1595606400) {
                console.log('已过期...')
                console.log('程序退出...')
                process.exit()
            }

            if (this.retryJob) {
                this.retryJob.stop()
            }

            console.log('开始登陆...')
            if (this.run) {
                remote.dialog.showMessageBox({
                    type:'info',
                    title: 'message',
                    message: '程序已经在运行',
                    buttons:['ok']
                })
                return
            }

            this.run = true

            const selInfo = this.selInfo
            browser = await puppeteer.launch({
                headless: false,
                devtools: true, // 自动开启 F12
                args: ['--start-maximized', '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
            // 设置浏览器视窗
            await page.setViewport({
                width: 1376,
                height: 768
            });
            // 监听新创建页面
            await browser.on('targetcreated', async (target) =>{
                const newTarget = await target.page()
            })
            // 请求拦截   //拦截图片
            await page.setRequestInterception(true)
            page.on('request', async req => {
                //判断如果是 图片请求  就直接拦截 
                if (req.resourceType() === 'image' ) {
                    req.abort();   //终止请求
                } else {
                    req.continue();//弹出
                }
                // console.log(interceptedRequest.method(),'method')//输出GET
            })

            // 设置cookie
            await page.setCookie({
              name: "city_id",
              value: ""+selInfo.city_id,
              domain: ".quyundong.com",
              path: '/',
              secure: false,
              session:false,
              httpOnly: false
            },{
              name: "connect.sid",
              value: selInfo.key,
              domain: ".quyundong.com",
              path: '/',
              secure: false,
              session: false,
              httpOnly: false,
              expires: 1657375347
            })
            await page.goto(selInfo.base_url, {
                waitUntil: "networkidle2"
            })

            const loginRes = await page.evaluate((info) => {
                // LOGIN
                return $.ajax({
                    type: 'get',
                    url: `${info.base_url}/user/userLogin?rondom=${info.random}&phone=${info.phone}&password=${info.pass}&code=${info.verifyCode}`
                })
            }, selInfo)

            if (loginRes.msg !== 'success') {
                console.error('登陆失败... 退出程序')
                process.exit()
            } else {
                console.log(`用户: ${loginRes.nick_name} 登陆成功...`)
            }
            const spaceRes = await page.evaluate((info) => {
                // 场地列表
                // return $.ajax({
                //     type:'get',
                //     url: `http://www.quyundong.com/index/businesslist?random=${info.random}&page=1&cat_id=${info.cat_id}&region_id=${info.region_id}`,
                // })
            }, selInfo);

            const hasOrder = await page.evaluate((info) => {
                return $.ajax({
                    type: 'get',
                    url: `${info.base_url}/order/getOrderDueCount`
                })
            }, selInfo)
            if (hasOrder.msg === 'success' && hasOrder.data && +hasOrder.data.count > 0) {
                remote.dialog.showMessageBox({
                    type:'info',
                    title: 'message',
                    message: '有未完成的订单，请先完成或取消未完成的订单，再重启程序',
                    buttons:['ok']
                },(index) => {
                    process.exit()
                })
            }

            await this.orderXianXia()
            this.run = false

            // 遍历场地代码
            // if (spaceRes.msg === 'success') {
            //     const maxPage = +spaceRes.data.pages
            //     const data = spaceRes.data.data
            //     // 日期
            //     const ts = dayjs().add(1, 'day').startOf('day').unix()
                
            //     for (let ind = 0; ind < data.length; ind ++) {
            //         const url = `${selfInfo.base_url}/detail/${data[ind].business_id}-${data[ind].category_id}.html?t=${ts}`
            //         await page.goto(url, {
            //             waitUntil: "networkidle2"
            //         })
            //         const target = await browser.waitForTarget(t => t.url().includes('/detail'))
            //         const tPage = await target.page()

            //         const placeName = await tPage.$eval('.venuesName', dom => dom.innerText)
            //         console.log(`正在查找${placeName}...`)

            //         // const placeEmpty = false

            //         const placeRes = await tPage.evaluate((info) => {
            //             return document.querySelector(`.single[place_holder*="${info.tr.start}-${info.tr.end}"]`)
            //         }, selInfo)
                    
            //         if (!placeRes) {
            //             console.log(`${${placeName}订满了`)
            //             continue
            //         } else {
            //             const spaceBtn = await tPage.waitForSelector(`.single[place_holder*="${selInfo.tr.start}-${selInfo.tr.end}"]`)
            //             await spaceBtn.click()
            //             console.log(`正在预定${placeName},${selInfo.tr.start}-${selInfo.tr.end}`)
            //             // 提交按钮ß
            //             const submitBtn = await tPage.waitForSelector('.submit-button')
            //             await submitBtn.click()
            //             await tPage.waitForNavigation()
            //             // 确认订单按钮
            //             const confirmBtn = await tPage.waitForSelector('.from-confirm .order')
            //             sleep(1000)
            //             await confirmBtn.click()
            //             remote.dialog.showMessageBox({
            //                 type:'info',
            //                 title: 'message',
            //                 message: '订场成功，请及时付款',
            //                 buttons:['ok']
            //             })
            //             break
            //         }
            //     }
            // }
        },

        async orderXianXia () {
            const selInfo = this.selInfo
            const business_id = 22875
            const category_id = 12
            // const ts = dayjs().add(1, 'day').startOf('day').unix()
            // const ts = 1594915200 // 7月17日
            const ts = dayjs(this.selInfo.date).unix()
            const url = `${selInfo.base_url}/detail/${business_id}-${category_id}.html?t=${ts}`
            await page.goto(url, {
                waitUntil: "networkidle2"
            })

            const target = await browser.waitForTarget(t => t.url().includes('/detail'))
            const tPage = await target.page()
            const placeName = await tPage.$eval('.venuesName', dom => dom.innerText)
            console.log(`正在查找${placeName} 16:00-19:00 ...`)

            const placeRes = await tPage.evaluate((info) => {
                const validPlace = []
                for (let i = 0; i < info.tr.length; i++) {
                    const target = document.querySelector(`.single[place_holder*="${info.tr[i]}"]`)
                    if (target) {
                        validPlace.push(`.single[place_holder*="${info.tr[i]}"]`)
                    }
                    // 一个人只抢2场
                    if (validPlace.length === 2) {
                        break
                    }
                } 
                return validPlace
            }, selInfo)

            if (placeRes.length === 0) {
                // 没有发现可用场地
                console.log(`没有发现符合条件的场地,5秒后将重试...`)
                if (!this.retryJob) {
                    this.retryJob = new cronJob(
                        '*/5 * * * * *',
                        async() => {
                            console.log('开始重试...')
                            await this.orderXianXia()
                        },
                        // oncomplete
                        null,
                        // startNow
                        true
                    )
                }
            } else {
                for (let i = 0; i < placeRes.length; i++) {
                    // 发现场地
                    console.log('发现场地...')
                    const spaceBtn = await tPage.waitForSelector(`${placeRes[i]}`)
                    sleep(1000)
                    await spaceBtn.click()
                 }
                // 提交按钮ß
                const submitBtn = await tPage.waitForSelector('.submit-button')
                sleep(1000)
                await submitBtn.click()
                
                await tPage.waitForNavigation()
                // 确认订单按钮
                const confirmBtn = await tPage.waitForSelector('.from-confirm .order')
                sleep(1000)
                await confirmBtn.click()
                // 是否超出时间范围
                // const pageList = await browser.pages()
                // console.log('pageList:', pageList)
                // // 超过可预订范围
                // const otherPage = pageList.find(item=>item.url().includes('/addOrder'))
                // console.log('otherPage:', otherPage)
                await tPage.waitForNavigation()
                sleep(1000)

                if (tPage.target()._targetInfo.url.indexOf('order/orderPay') > -1) {
                    console.log(`正在预定${placeName}`)
                    console.log('订场结束...')
                    remote.dialog.showMessageBox({
                        type:'info',
                        title: 'message',
                        message: '订场成功，请及时付款',
                        buttons:['ok']
                    })
                } else {
                    console.log(`该场次不在可预订周期内...`)
                    console.log(`请选择可预订时的时间...`)
                    browser.close()
                }
            }
        },
    }
}
</script>
<style scoped>
</style>
