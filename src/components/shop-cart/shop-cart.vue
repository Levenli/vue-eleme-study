<template>
  <div>
    <div class="shopcart">
      <div class="content">
        <div class="content-left" @click="toggleList">
          <div class="logo-wrapper">
            <div class="logo" :class="{'highlight':totalCount>0}">
              <i class="icon-shopping_cart" :class="{'highlight':totalCount>0}"></i>
            </div>
            <div class="num" v-show="totalCount>0">
              <bubble :num="totalCount"></bubble>
            </div>
          </div>
          <div class="price" :class="{'highlight':totalPrice>0}">￥{{totalPrice}}</div>
          <div class="desc">另需配送费￥{{deliveryPrice}}元</div>
        </div>
        <div class="content-right">
          <div @click.stop="pay" class="pay" :class="payClass">{{payDesc}}</div>
        </div>
      </div>
      <!-- 小球容器 -->
      <div class="ball-container">
        <div v-for="(ball,index) in balls" :key="index">
          <transition @before-enter="beforeDrop" @enter="droping" @after-enter="afterDrop">
            <div class="ball" v-show="ball.show">
              <div class="inner inner-hook"></div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Bubble from 'components/bubble/bubble'

const BALL_LEN = 10
const innerClsHook = 'inner-hook'

function createBalls () {
  let balls = []
  for (let i = 0; i < BALL_LEN; i++) {
    balls.push({ show: false })
  }
  return balls
}

export default {
  name: 'shop-cart',
  props: {
    selectFoods: {
      type: Array,
      default () {
        return []
      }
    },
    deliveryPrice: {
      type: Number,
      default: 0
    },
    minPrice: {
      type: Number,
      default: 0
    },
    fold: {
      type: Boolean,
      default: true
    },
    sticky: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      balls: createBalls(),
      listFold: this.fold
    }
  },
  computed: {
    totalPrice () {
      let total = 0
      this.selectFoods.forEach((food) => {
        total += food.price * food.count
      })
      return total
    },
    totalCount () {
      let count = 0
      this.selectFoods.forEach((food) => {
        count += food.count
      })
      return count
    },
    payDesc () {
      if (this.totalPrice === 0) {
        return `￥${this.minPrice}元起送`
      } else if (this.totalPrice < this.minPrice) {
        let diff = this.minPrice - this.totalPrice
        return `还差￥${diff}元起送`
      } else {
        return '去结算'
      }
    },
    payClass () {
      if (!this.totalCount || this.totalPrice < this.minPrice) {
        return 'not-enough'
      } else {
        return 'enough'
      }
    }
  },
  components: {
    Bubble
  },
  created () {
    // this.dropBalls不是响应式的，所以不用放在data(){}中
    this.dropBalls = []
  },
  methods: {
    pay(e) {
      if (this.totalPrice < this.minPrice) {
        return
      }
      this.dialogComp = this.dialogComp || this.$createDialog({
        title: '支付',
        content: `支付${this.totalPrice}元`
      })
      this.dialogComp.show()
      e.stopPropagation()
    },
    drop (el) { // 驱动小球的transition过渡
      for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i]
        if (!ball.show) {
          ball.show = true
          // 保存 "+按钮" 的dom
          ball.el = el
          // 把 “取消隐藏的小球” 存入 “下落的小球数组” 里
          this.dropBalls.push(ball)
          return
        }
      }
    },
    beforeDrop (el) {
      // 最后一个小球==第一个下落的小球
      const ball = this.dropBalls[this.dropBalls.length - 1]
      const rect = ball.el.getBoundingClientRect()
      const x = rect.left - 32
      const y = -(window.innerHeight - rect.top - 22)
      el.style.display = ''
      el.style.transform = el.style.webkitTransform = `translate3d(0,${y}px,0)`
      const inner = el.getElementsByClassName(innerClsHook)[0]
      inner.style.transform = inner.style.webkitTransform = `translate3d(${x}px,0,0)`
    },
    droping (el, done) {
      // 一个动画完成后，需要触发一次“重绘”
      this._reflow = document.body.offsetHeight
      el.style.transform = el.style.webkitTransform = `translate3d(0,0,0)`
      const inner = el.getElementsByClassName(innerClsHook)[0]
      inner.style.transform = inner.style.webkitTransform = `translate3d(0,0,0)`
      el.addEventListener('transitionend', done)
    },
    afterDrop (el) {
      const ball = this.dropBalls.shift()
      if (ball) {
        ball.show = false
        el.style.display = 'none'
      }
    },
    toggleList () {
      if (this.listFold) {
        if (!this.totalCount) {
          return
        }
        this.listFold = false
        this._showShopCartList()
        this._showShopCartSticky()
      } else {
        this.listFold = true
        this._hideShopCartList()
      }
    },
    _showShopCartList () {
      this.shopCartListComp = this.shopCartListComp || this.$createShopCartList({
        $props: {
          selectFoods: 'selectFoods'
        },
        $events: {
          hide: () => {
            this.listFold = true
          },
          leave: () => {
            this._hideShopCartSticky()
          },
          add: (el) => {
            // 调用shop-cart-sticky里的drop(),实现购物车列表小球飞入动画
            console.log(this.shopCartStickyComp)
            console.log(this.shopCartStickyComp.drop)
            this.shopCartStickyComp.drop(el)
          }
        }
      })
      this.shopCartListComp.show()
    },
    _showShopCartSticky () {
      this.shopCartStickyComp = this.shopCartStickyComp || this.$createShopCartSticky({
        $props: {
          selectFoods: 'selectFoods',
          deliveryPrice: 'deliveryPrice',
          minPrice: 'minPrice',
          fold: 'listFold',
          list: this.shopCartListComp
        }
      })
      this.shopCartStickyComp.show()
    },
    _hideShopCartList () {
      // 1.原本写法
      // this.$parent.list.hide()
      // this.shopCartListComp.hide()

      // 2.新写法
      const comp = this.sticky ? this.$parent.list : this.shopCartListComp
      comp.hide && comp.hide()
    },
    _hideShopCartSticky() {
      this.shopCartStickyComp.hide()
    }
  },
  watch: {
    fold(newVla) {
      this.listFold = newVla
    },
    totalCount(newVla) {
      // 监听，当购物车列表没有商品时，隐藏列表本身
      if (!this.listFold && !newVla) {
        this._hideShopCartList()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~common/stylus/mixin';
@import '~common/stylus/variable';

.shopcart {
  height: 100%;

  .content {
    display: flex;
    background: $color-background;
    font-size: 0;
    color: $color-light-grey;

    .content-left {
      flex: 1;

      .logo-wrapper {
        display: inline-block;
        vertical-align: top;
        position: relative;
        top: -10px;
        margin: 0 12px;
        padding: 6px;
        width: 56px;
        height: 56px;
        box-sizing: border-box;
        border-radius: 50%;
        background: $color-background;

        .logo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          text-align: center;
          background: $color-dark-grey;

          &.highlight {
            background: $color-blue;
          }

          .icon-shopping_cart {
            line-height: 44px;
            font-size: $fontsize-large-xxx;
            color: $color-light-grey;

            &.highlight {
              color: $color-white;
            }
          }
        }

        .num {
          position: absolute;
          top: 0;
          right: 0;
        }
      }

      .price {
        display: inline-block;
        vertical-align: top;
        margin-top: 12px;
        line-height: 24px;
        padding-right: 12px;
        box-sizing: border-box;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 700;
        font-size: $fontsize-large;

        &.highlight {
          color: $color-white;
        }
      }

      .desc {
        display: inline-block;
        vertical-align: top;
        margin: 12px 0 0 12px;
        line-height: 24px;
        font-size: $fontsize-small-s;
      }
    }

    .content-right {
      flex: 0 0 105px;
      width: 105px;

      .pay {
        height: 48px;
        line-height: 48px;
        text-align: center;
        font-weight: 700;
        font-size: $fontsize-small;

        &.not-enough {
          background: $color-dark-grey;
        }

        &.enough {
          background: $color-green;
          color: $color-white;
        }
      }
    }
  }

  .ball-container {
    .ball {
      position: fixed;
      left: 32px;
      bottom: 22px;
      z-index: 200;
      transition: all 0.4s cubic-bezier(0.49, -0.29, 0.75, 0.41);

      .inner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: $color-blue;
        transition: all 0.4s linear;
      }
    }
  }
}
</style>
