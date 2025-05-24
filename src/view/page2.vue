<template>
    <div class="page-content">
     </div>
    
    <div class="stats">
      <p>小球1速度: ({{ ball1.dx.toFixed(2) }}, {{ ball1.dy.toFixed(2) }})</p>
      <p>小球2速度: ({{ ball2.dx.toFixed(2) }}, {{ ball2.dy.toFixed(2) }})</p>
    </div>
     <button @click="resetSimulation">重置模拟</button>
      <button @click="randomizeSpeeds">随机速度</button>
      <button @click="toggleSimulation">
        {{ isRunning ? '暂停' : '开始' }}
      </button>

</template>
<script setup>
import router from '../router';
import * as THREE from 'three'

export default {
  name: 'BallSimulator',
  data() {
    return {
      width: 800,
      height: 500,
      ball1: {
        x: 300,
        y: 200,
        radius: 30,
        dx: 4,
        dy: 0,
        color: '#3498db',
        mass: 30 * 30,
        originalX: 300,
        originalY: 200,
        originalDx: 4,
        originalDy: 0
      },
      ball2: {
        x: 500,
        y: 200,
        radius: 25,
        dx: -3,
        dy: 0,
        color: '#e74c3c',
        mass: 25 * 25,
        originalX: 500,
        originalY: 200,
        originalDx: -3,
        originalDy: 0
      },
      isRunning: true,
      animationFrameId: null,
      ctx: null
    }
  },
  computed: {
    leftWall() {
      return 0
    },
    rightWall() {
      return this.width
    },
    ground() {
      return this.height
    }
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.startSimulation()
  },
  beforeUnmount() {
    this.stopSimulation()
  },
  methods: {
    startSimulation() {
      this.isRunning = true
      this.animate()
    },
    stopSimulation() {
      this.isRunning = false
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
    },
    toggleSimulation() {
      if (this.isRunning) {
        this.stopSimulation()
      } else {
        this.startSimulation()
      }
    },
    animate() {
      if (!this.isRunning) return
      
      this.ctx.clearRect(0, 0, this.width, this.height)
      
      // 绘制墙壁和地面
      this.drawWalls()
      
      // 更新小球位置
      this.updateBall(this.ball1)
      this.updateBall(this.ball2)
      
      // 检测碰撞
      this.checkCollision()
      
      this.animationFrameId = requestAnimationFrame(this.animate)
    },
    drawWalls() {
      this.ctx.strokeStyle = '#333'
      this.ctx.lineWidth = 2
      
      // 左侧墙
      this.ctx.beginPath()
      this.ctx.moveTo(this.leftWall, 0)
      this.ctx.lineTo(this.leftWall, this.ground)
      this.ctx.stroke()
      
      // 右侧墙
      this.ctx.beginPath()
      this.ctx.moveTo(this.rightWall, 0)
      this.ctx.lineTo(this.rightWall, this.ground)
      this.ctx.stroke()
      
      // 地面
      this.ctx.beginPath()
      this.ctx.moveTo(this.leftWall, this.ground)
      this.ctx.lineTo(this.rightWall, this.ground)
      this.ctx.stroke()
      
      // 添加标签
      this.ctx.fillStyle = '#333'
      this.ctx.font = '14px Arial'
      this.ctx.fillText('左墙', 10, 20)
      this.ctx.fillText('右墙', this.width - 50, 20)
      this.ctx.fillText('地面', this.width / 2 - 20, this.height - 10)
    },
    updateBall(ball) {
      // 检测与墙壁的碰撞（水平方向）
      if (ball.x + ball.radius > this.rightWall) {
        ball.x = this.rightWall - ball.radius
        ball.dx = -ball.dx * 0.95 // 稍微减少能量模拟摩擦力
      } else if (ball.x - ball.radius < this.leftWall) {
        ball.x = this.leftWall + ball.radius
        ball.dx = -ball.dx * 0.95
      }

      // 检测与地面的碰撞（垂直方向）
      if (ball.y + ball.radius > this.ground) {
        ball.y = this.ground - ball.radius
        ball.dy = -ball.dy * 0.95 // 稍微减少能量模拟摩擦力
        
        // 如果速度很小，停止反弹
        if (Math.abs(ball.dy) < 0.5) {
          ball.dy = 0
        }
      }

      // 应用重力
      ball.dy += 0.2

      // 更新位置
      ball.x += ball.dx
      ball.y += ball.dy

      // 绘制小球
      this.ctx.beginPath()
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = ball.color
      this.ctx.fill()
      this.ctx.closePath()
    },
    checkCollision() {
      const dx = this.ball2.x - this.ball1.x
      const dy = this.ball2.y - this.ball1.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果距离小于半径之和，则发生碰撞
      if (distance < this.ball1.radius + this.ball2.radius) {
        // 计算碰撞角度
        const angle = Math.atan2(dy, dx)

        // 计算速度分量
        const speed1 = Math.sqrt(this.ball1.dx * this.ball1.dx + this.ball1.dy * this.ball1.dy)
        const speed2 = Math.sqrt(this.ball2.dx * this.ball2.dx + this.ball2.dy * this.ball2.dy)

        // 计算方向角度
        const direction1 = Math.atan2(this.ball1.dy, this.ball1.dx)
        const direction2 = Math.atan2(this.ball2.dy, this.ball2.dx)

        // 计算碰撞后的速度 (弹性碰撞)
        const velocityX1 = (speed1 * Math.cos(direction1 - angle) * (this.ball1.mass - this.ball2.mass) + 
                          2 * this.ball2.mass * speed2 * Math.cos(direction2 - angle)) / 
                          (this.ball1.mass + this.ball2.mass) * Math.cos(angle) + 
                          speed1 * Math.sin(direction1 - angle) * Math.cos(angle + Math.PI/2)
        
        const velocityY1 = (speed1 * Math.cos(direction1 - angle) * (this.ball1.mass - this.ball2.mass) + 
                          2 * this.ball2.mass * speed2 * Math.cos(direction2 - angle)) / 
                          (this.ball1.mass + this.ball2.mass) * Math.sin(angle) + 
                          speed1 * Math.sin(direction1 - angle) * Math.sin(angle + Math.PI/2)
        
        const velocityX2 = (speed2 * Math.cos(direction2 - angle) * (this.ball2.mass - this.ball1.mass) + 
                          2 * this.ball1.mass * speed1 * Math.cos(direction1 - angle)) / 
                          (this.ball1.mass + this.ball2.mass) * Math.cos(angle) + 
                          speed2 * Math.sin(direction2 - angle) * Math.cos(angle + Math.PI/2)
        
        const velocityY2 = (speed2 * Math.cos(direction2 - angle) * (this.ball2.mass - this.ball1.mass) + 
                          2 * this.ball1.mass * speed1 * Math.cos(direction1 - angle)) / 
                          (this.ball1.mass + this.ball2.mass) * Math.sin(angle) + 
                          speed2 * Math.sin(direction2 - angle) * Math.sin(angle + Math.PI/2)

        // 更新小球速度
        this.ball1.dx = velocityX1 * 0.95 // 稍微减少能量模拟摩擦力
        this.ball1.dy = velocityY1 * 0.95
        this.ball2.dx = velocityX2 * 0.95
        this.ball2.dy = velocityY2 * 0.95

        // 防止小球重叠
        const overlap = (this.ball1.radius + this.ball2.radius - distance) / 2
        this.ball1.x -= overlap * Math.cos(angle)
        this.ball1.y -= overlap * Math.sin(angle)
        this.ball2.x += overlap * Math.cos(angle)
        this.ball2.y += overlap * Math.sin(angle)
      }
    },
    resetSimulation() {
      this.ball1.x = this.ball1.originalX
      this.ball1.y = this.ball1.originalY
      this.ball1.dx = this.ball1.originalDx
      this.ball1.dy = this.ball1.originalDy
      
      this.ball2.x = this.ball2.originalX
      this.ball2.y = this.ball2.originalY
      this.ball2.dx = this.ball2.originalDx
      this.ball2.dy = this.ball2.originalDy
    },
    randomizeSpeeds() {
      this.ball1.dx = (Math.random() - 0.5) * 10
      this.ball1.dy = (Math.random() - 0.5) * 5
      
      this.ball2.dx = (Math.random() - 0.5) * 10
      this.ball2.dy = (Math.random() - 0.5) * 5
    }
  }
}
</script>

<style scoped>
.simulator-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

canvas {
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
}

.controls {
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  cursor: pointer;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}

.stats {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;
}
</style>