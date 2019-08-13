<template>
  <div class="goods">
    <div class="scroll-nav-wrapper">
      <cube-scroll-nav
        :side=true
        :data="goods"
        :options="scrollOptions"
        v-if="goods.length"
      >
        <template slot="bar" slot-scope="props">
          <cube-scroll-nav-bar
            direction="vertical"
            :labels="props.labels"
            :txts="barTxts"
            :current="props.current"
          >
            <template slot-scope="props">
              <div class="text">
                <!-- icon -->
                <support-ico
                  v-if="props.txt.type>=1"
                  :size=3
                  :type="props.txt.type"
                ></support-ico>
                <!-- name -->
                <span>{{props.txt.name}}</span>
                <!-- count -->
                <span class="num" v-if="props.txt.count">
                  <bubble :num="props.txt.count"></bubble>
                </span>
              </div>
            </template>
          </cube-scroll-nav-bar>
        </template>
        <cube-scroll-nav-panel
          v-for="good in goods"
          :key="good.name"
          :label="good.name"
          :title="good.name"
        >
          <ul>
            <li
              @click="selectFood(food)"
              v-for="food in good.foods"
              :key="food.name"
              class="food-item"
            >
              <div class="icon">
                <img width="57" height="57" :src="food.icon">
              </div>
              <div class="content">
                <h2 class="name">{{food.name}}</h2>
                <p class="desc">{{food.description}}</p>
                <div class="extra">
                  <span class="count">月售{{food.sellCount}}份</span><span>好评率{{food.rating}}%</span>
                </div>
                <div class="price">
                  <span class="now">￥{{food.price}}</span>
                  <span class="old" v-show="food.oldPrice">￥{{food.oldPrice}}</span>
                </div>
                <div class="cart-control-wrapper">
                  <cart-control @add="onAdd" :food="food"></cart-control>
                </div>
              </div>
            </li>
          </ul>
        </cube-scroll-nav-panel>
      </cube-scroll-nav>
    </div>
    <div class="shop-cart-wrapper">
      <shop-cart
        ref="shopCartDom"
        :selectFoods="selectFoods"
        :delivery-price="seller.deliveryPrice"
        :min-price="seller.minPrice"></shop-cart>
    </div>
  </div>
</template>

<script>
import { getGoods } from 'api'
import CartControl from 'components/cart-control/cart-control'
import ShopCart from 'components/shop-cart/shop-cart'
// import Food from 'components/food/food'
import SupportIco from 'components/support-ico/support-ico'
import Bubble from 'components/bubble/bubble'

export default {
  name: 'goods',
  components: {
    ShopCart,
    CartControl,
    SupportIco,
    Bubble
  },
  props: {
    data: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  data() {
    return {
      goods: [],
      selectedFood: {},
      scrollOptions: {
        click: false,
        directionLockThreshold: 0
      }
    }
  },
  computed: {
    seller() {
      return this.data.seller
    },
    selectFoods() {
      let ret = []
      this.goods.forEach((good) => {
        good.foods.forEach((food) => {
          if (food.count) {
            ret.push(food)
          }
        })
      })
      return ret
    },
    barTxts() { // 遍历data.json中的goods数据，找到每项的name,type,count并返回
      let ret = []
      this.goods.forEach((good) => {
        let { name, type, foods } = good
        let count = 0
        foods.forEach((food) => {
          count += food.count || 0
        })
        ret.push({
          name,
          type,
          count
        })
      })
      return ret
    }
  },
  methods: {
    fetch() {
      // 优化切换TAB时，购物车列表会清空问题：
      // fetched没有定义，初始值为undefined；
      // 当第一次获取goods数据后，设置fetched==true,不用再次获取数据重新渲染组件
      if (!this.fetched) {
        this.fetched = true
        getGoods({
          id: this.seller.id
        }).then((goods) => {
          this.goods = goods
        })
      }
    },
    onAdd(el) { // 驱动小球下落动画drop(el){}
      // console.log(el)
      // console.log(this.$refs.shopCartDom)
      this.$refs.shopCartDom.drop(el)
    },
    selectFood(food) {
      this.selectedFood = food
      this._showFood()
      this._showShopCartSticky()
    },
    _showFood() {
      this.foodComp = this.foodComp || this.$createFood({
        $props: {
          food: 'selectedFood'
        },
        $events: {
          leave: () => {
            this._hideShopCartList()
          },
          add: (el) => {
            this.shopCartStickyComp.drop(el)
          }
        }
      })
      this.foodComp.show()
    },
    _showShopCartSticky() {
      this.shopCartStickyComp = this.shopCartStickyComp || this.$createShopCartSticky({
        $props: {
          selectFoods: 'selectFoods',
          deliveryPrice: this.seller.deliveryPrice,
          minPrice: this.seller.minPrice,
          fold: true
        }
      })
      this.shopCartStickyComp.show()
    },
    _hideShopCartList() {
      this.shopCartStickyComp.hide()
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '~common/stylus/mixin';
@import '~common/stylus/variable';

.goods {
  position: relative;
  text-align: left;
  height: 100%;

  .scroll-nav-wrapper {
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    bottom: 48px;
  }

  >>> .cube-scroll-nav-bar {
    width: 80px;
    white-space: normal;
    overflow: hidden;
  }

  >>> .cube-scroll-nav-bar-item {
    padding: 0 10px;
    display: flex;
    align-items: center;
    height: 56px;
    line-height: 14px;
    font-size: $fontsize-small;
    background: $color-background-ssss;

    .text {
      flex: 1;
      position: relative;
    }

    .num {
      position: absolute;
      right: -8px;
      top: -10px;
    }

    .support-ico {
      display: inline-block;
      vertical-align: top;
      margin-right: 4px;
    }
  }

  >>> .cube-scroll-nav-bar-item_active {
    background: $color-white;
    color: $color-dark-grey;
  }

  >>> .cube-scroll-nav-panel-title {
    padding-left: 14px;
    height: 26px;
    line-height: 26px;
    border-left: 2px solid $color-col-line;
    font-size: $fontsize-small;
    color: $color-grey;
    background: $color-background-ssss;
  }

  .food-item {
    display: flex;
    margin: 18px;
    padding-bottom: 18px;
    position: relative;

    &:last-child {
      border-none();
      margin-bottom: 0;
    }

    .icon {
      flex: 0 0 57px;
      margin-right: 10px;

      img {
        height: auto;
      }
    }

    .content {
      flex: 1;

      .name {
        margin: 2px 0 8px 0;
        height: 14px;
        line-height: 14px;
        font-size: $fontsize-medium;
        color: $color-dark-grey;
      }

      .desc, .extra {
        line-height: 10px;
        font-size: $fontsize-small-s;
        color: $color-light-grey;
      }

      .desc {
        line-height: 12px;
        margin-bottom: 8px;
      }

      .extra {
        .count {
          margin-right: 12px;
        }
      }

      .price {
        font-weight: 700;
        line-height: 24px;

        .now {
          margin-right: 8px;
          font-size: $fontsize-medium;
          color: $color-red;
        }

        .old {
          text-decoration: line-through;
          font-size: $fontsize-small-s;
          color: $color-light-grey;
        }
      }
    }

    .cart-control-wrapper {
      position: absolute;
      right: 0;
      bottom: 12px;
    }
  }

  .shop-cart-wrapper {
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 50;
    width: 100%;
    height: 48px;
  }
}
</style>
