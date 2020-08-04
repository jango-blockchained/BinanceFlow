import _ from 'lodash'
const superagent = require('superagent')

export default {
    data() {
        return {
            ws: null,
            rest: superagent,
            loading: false,
            connected: false
        }
    },
    computed: {
        baseSymbol() {
            return this.$store.state.pair.base
        },
        quoteSymbol() {
            return this.$store.state.pair.quote
        },
        apiKey() {
            return this.$store.state.api.key
        },
        apiSecret() {
            return this.$store.state.api.secret
        },
        currentStatus() {
            return this.connected ? (this.sumValue.buy >= this.sumValue.sell ? 'success-color' : 'error-color') : null
        }
    },
    watch: {
        $route() {
            this.$store.commit('baseSymbol', this.$route.params.base)
            this.$store.commit('quoteSymbol', this.$route.params.quote)
            this.reOpenSocket()
        }
    },
    mounted() {
        this.$store.commit('baseSymbol', this.$route.params.base)
        this.$store.commit('quoteSymbol', this.$route.params.quote)
        this.reset()
        // this.toggleConnection()
    },
    methods: {
        betterNumber(input) {
            let [intValue = '0', floatValue = '00'] = _.split(input, '.')
            return [
                '<strong>',
                _.replace(intValue, /\B(?=(\d{3})+(?!\d))/g, ','),
                '</strong>',
                '<small>.</small>',
                '<small>',
                _.padEnd(floatValue, 6, '0'),
                '</small>'
            ].join('')
        },
        toggleConnection() {
            if (!this.loading) {
                this.loading = true
                if (this.connected) {
                    this.closeSocket()
                } else {
                    if (this.requestName) {
                        this.httpRequest()
                            .then(({ body = {} }) => {
                                if (this.streamName) {
                                    if (this.listenOnRest) {
                                        this.listenOnRest(body)
                                    }
                                    this.openSocket()
                                } else {
                                    this.loading = false
                                }
                            })
                            .catch(e => {
                                console.log(e)
                                this.loading = false
                            })
                    } else {
                        if (this.streamName) {
                            this.openSocket()
                        }
                    }
                }
            }
        },
        httpRequest() {
            console.log('d')
            return this.rest([this.$store.state.api.rest, this.requestName].join(''))
        },
        openSocket() {
            this.ws = new WebSocket([this.$store.state.api.ws, 'stream?streams=', this.streamName].join(''))
            this.ws.addEventListener('open', () => {
                this.loading = false
                this.connected = true
                if (this.reset) {
                    this.reset()
                }
            })
            this.ws.addEventListener('message', ({ data }) => {
                if (this.listenOnSocket) {
                    this.listenOnSocket(JSON.parse(data))
                }
            })
            this.ws.addEventListener('error', e => {
                this.ws.close()
                console.log(e)
            })
            this.ws.addEventListener('close', () => {
                this.loading = false
                this.connected = false
            })
        },
        reOpenSocket() {
            this.closeSocket()
            this.openSocket()
        },
        closeSocket() {
            if (this.ws) {
                this.ws.close()
            }
        }
    },
    beforeDestroy() {
        this.closeSocket()
    }
}