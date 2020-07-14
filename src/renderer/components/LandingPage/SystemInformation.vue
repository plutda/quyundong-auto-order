<template>
    <div>
        <el-container>
            <el-aside>
                <el-form label-width="80px" :model="selInfo">
                    <!-- <el-form-item label="预定日期">
                        <el-input v-model="selInfo.date"></el-input>
                        <span style="color:red; font-size:12px">(需要是YYYY-MM-DD格式)</span>
                    </el-form-item> -->
                    <el-form-item label="场地ids">
                        <el-input v-model="selInfo.ids"></el-input>
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    name: "ss",
    data() {
        return {
            retryTimer: '',
            selInfo: {
                ids: '353544763,353544764',
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
            run: false,
            flag1: false,
            flag2: false
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
            if (this.retryTimer) {
                clearInterval(this.retryTimer)
                this.retryTimer = null
            }
            if (browser) {
                browser.close()
            }
            this.run = false
            console.info('重试已经停止...')
        },
        async startFn() {
            try {
                // 到2020-07-25 00:00:00,程序失效
                if (dayjs().unix() > 1595606400) {
                    console.log('已过期...')
                    console.log('程序退出...')
                    process.exit()
                }

                if (browser) {
                    browser.close()
                }

                if (this.retryTimer) {
                    clearInterval(this.retryTimer)
                    this.retryTimer = null
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
                    headless: true,
                    devtools: true, // 自动开启 F12
                    args: ['--start-maximized', '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox']
                });
                page = await browser.newPage();
                // 设置浏览器视窗
                await page.setViewport({
                    width: 1376,
                    height: 768
                })
                // 请求拦截   //拦截图片
                await page.setRequestInterception(true)
                page.on('request', async req => {
                    //判断如果是 图片请求 和css  就直接拦截 
                    if (req.resourceType() === 'Image' || req.resourceType() === 'Stylesheet' || req.resourceType() === 'Font') {
                        req.abort();   //终止请求
                    } else {
                        req.continue();//弹出
                    }
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
                    browser.close()
                    this.run = false
                } else {
                    console.log(`用户: ${loginRes.nick_name} 登陆成功...`)
                }

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
                        browser.close()
                        this.run = false
                    })
                }

                await this.orderXianXia()

                this.run = false
            } catch (e) {

            }
            
        },

        async orderXianXia () {
            try {
                this.flag2 = false
                console.log(`正在查找...`)
                // 直接提交订单
                const orderRes = await page.evaluate((info) => {
                    // id写死
                    const ids = info.ids
                    // const ids = ['352061397', '352061398']
                    return $.ajax({
                        type: 'post',
                        url: `http://www.quyundong.com/order/addOrder`,
                        data: {
                            order_type: 0,
                            goods_id: ids,
                            goods_number: 1
                        }
                    })
                }, this.selInfo)

                const inPayPage = orderRes.indexOf('<title>订单支付 - 趣运动</title>') > -1

                this.flag2 = true

                if (inPayPage) {
                    console.log(`正在预定...`)
                    browser.close()

                    if (this.retryTimer) {
                        clearInterval(this.retryTimer)
                        this.retryTimer = null
                    }

                    remote.dialog.showMessageBox({
                        type:'info',
                        title: 'message',
                        message: '订场成功，请及时付款',
                        buttons:['ok']
                    })
                } else {
                    console.log(`该场次暂不可预订...`)
                    if (!this.retryTimer) {
                        this.retryTimer = setInterval(async() => {
                            if (this.flag2) {
                                await this.orderXianXia()
                            }
                        }, 100)
                        // this.retryJob = new cronJob(
                        //     '*/1 * * * * *',
                        //     async() => {
                        //         if (this.flag2) {
                        //             console.log('开始重试...')
                        //             await this.orderXianXia()
                        //         }
                        //     },
                        //     // oncomplete
                        //     null,
                        //     // startNow
                        //     true
                        // )
                    }
                }
            } catch (e) {

            }
        },
    }
}
</script>
<style scoped>
</style>
