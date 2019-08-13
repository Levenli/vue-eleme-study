const ALL = 2

export default {
  data() {
    return {
      selectType: ALL,
      onlyContent: true
    }
  },
  computed: {
    computedRatings() {
      let ret = []
      this.ratings.forEach((rating) => {
        if (this.onlyContent && !rating.text) {
          // 当选择“只看有内容的评论”并且“这条是没有文案的”时
          return
        }
        if (this.selectType === ALL || rating.rateType === this.selectType) {
          ret.push(rating)
        }
      })
      return ret
    }
  },
  methods: {
    onSelect(type) {
      this.selectType = type
    },
    onToggle() {
      this.onlyContent = !this.onlyContent
    }
  }
}
