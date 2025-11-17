<template>
  <div class="analytics-page">
    <h1>Writing Analytics</h1>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div class="metrics">
        <p><strong>Total Words Written:</strong> {{ totalWords }}</p>
        <p><strong>Longest Streak:</strong> {{ longestStreak }} days</p>
      </div>

      <div class="chart-container">
        <canvas id="wordCountChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchAnalytics } from '../api/analytics';
import { Chart } from 'chart.js';

export default {
  data() {
    return {
      analytics: [],
      totalWords: 0,
      longestStreak: 0,
      loading: true,
    };
  },
  async mounted() {
    try {
      const userId = this.$store.state.user.id; // Assuming user ID is stored in Vuex
      const data = await fetchAnalytics(userId);
      this.analytics = data;
      this.calculateMetrics(data);
      this.renderChart(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    calculateMetrics(data) {
      // Calculate total words written
      this.totalWords = data.reduce((sum, entry) => sum + entry.word_count, 0);

      // Calculate the longest streak
      this.longestStreak = this.calculateStreak(data);
    },
    calculateStreak(data) {
      // Sort data by date
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      let streak = 0;
      let maxStreak = 0;

      for (let i = 1; i < sortedData.length; i++) {
        const prevDate = new Date(sortedData[i - 1].date);
        const currDate = new Date(sortedData[i].date);

        // Check if the current date is consecutive
        if ((currDate - prevDate) / (1000 * 60 * 60 * 24) === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }

      return maxStreak + 1; // Include the first day of the streak
    },
    renderChart(data) {
      const ctx = document.getElementById('wordCountChart').getContext('2d');
      const labels = data.map(entry => entry.date);
      const wordCounts = data.map(entry => entry.word_count);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Daily Word Count',
              data: wordCounts,
              borderColor: 'blue',
              backgroundColor: 'rgba(0, 0, 255, 0.1)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });
    },
  },
};
</script>

<style scoped>
.analytics-page {
  padding: 20px;
}

.metrics {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  font-size: 18px;
}
</style>