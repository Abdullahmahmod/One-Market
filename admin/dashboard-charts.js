(() => {
  'use strict';

  // Store chart instances globally so they can be destroyed later
  const ChartInstances = {
    weeklySales: null,
    topProducts: null,
    paymentMethod: null,
    packageDistribution: null
  };

  const Charts = {
    /**
     * Initialize all charts
     */
    initCharts(orders) {
      Charts.destroyAllCharts();
      
      // Get chart contexts
      const weeklySalesCtx = document.getElementById('weeklySalesChart')?.getContext('2d');
      const topProductsCtx = document.getElementById('topProductsChart')?.getContext('2d');
      const paymentMethodCtx = document.getElementById('paymentMethodChart')?.getContext('2d');
      const packageDistributionCtx = document.getElementById('packageDistributionChart')?.getContext('2d');

      if (weeklySalesCtx) {
        ChartInstances.weeklySales = Charts.createWeeklySalesChart(weeklySalesCtx, orders);
      }

      if (topProductsCtx) {
        ChartInstances.topProducts = Charts.createTopProductsChart(topProductsCtx, orders);
      }

      if (paymentMethodCtx) {
        ChartInstances.paymentMethod = Charts.createPaymentMethodChart(paymentMethodCtx, orders);
      }

      if (packageDistributionCtx) {
        ChartInstances.packageDistribution = Charts.createPackageDistributionChart(packageDistributionCtx, orders);
      }
    },

    /**
     * Destroy all chart instances to prevent memory leaks
     */
    destroyAllCharts() {
      Object.values(ChartInstances).forEach(chart => {
        if (chart instanceof Chart) {
          chart.destroy();
        }
      });
    },

    /**
     * Create weekly sales chart
     */
    createWeeklySalesChart(ctx, orders) {
      const weeklySales = Charts.calculateWeeklySales(orders);
      const labels = weeklySales.labels;
      const data = weeklySales.data;

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#e9f0f5' : '#112432';
      const borderColor = isDark ? '#2a3b4b' : '#d7e1e8';
      const primaryColor = isDark ? '#2fbc87' : '#0f8f65';

      return new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'المبيعات (جنيه)',
            data,
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}20`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: textColor,
                font: { family: '"Cairo", sans-serif', size: 13, weight: '600' }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: textColor },
              grid: { color: borderColor }
            },
            x: {
              ticks: { color: textColor },
              grid: { color: borderColor }
            }
          }
        }
      });
    },

    /**
     * Create top products chart
     */
    createTopProductsChart(ctx, orders) {
      const topProducts = Charts.calculateTopProducts(orders);
      const labels = topProducts.map(p => p.name);
      const data = topProducts.map(p => p.quantity);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#e9f0f5' : '#112432';
      const borderColor = isDark ? '#2a3b4b' : '#d7e1e8';
      const colors = ['#0f8f65', '#2c7be5', '#f59e0b', '#ef4444', '#8b5cf6'];

      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: isDark ? '#15212c' : '#ffffff',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: { family: '"Cairo", sans-serif', size: 12, weight: '600' },
                padding: 15
              }
            }
          }
        }
      });
    },

    /**
     * Create payment method chart
     */
    createPaymentMethodChart(ctx, orders) {
      const paymentMethods = Charts.calculatePaymentMethods(orders);
      const labels = Object.keys(paymentMethods);
      const data = Object.values(paymentMethods);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#e9f0f5' : '#112432';
      const colors = ['#10b981', '#3b82f6', '#f59e0b'];

      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'عدد الطلبات',
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: textColor,
                font: { family: '"Cairo", sans-serif', size: 12, weight: '600' }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: isDark ? '#2a3b4b' : '#d7e1e8' }
            },
            y: {
              ticks: { color: textColor },
              grid: { display: false }
            }
          }
        }
      });
    },

    /**
     * Create package distribution chart
     */
    createPackageDistributionChart(ctx, orders) {
      const packageDist = Charts.calculatePackageDistribution(orders);
      const labels = Object.keys(packageDist);
      const data = Object.values(packageDist);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#e9f0f5' : '#112432';
      const colors = ['#6366f1', '#ec4899', '#14b8a6'];

      return new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: isDark ? '#15212c' : '#ffffff',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: { family: '"Cairo", sans-serif', size: 12, weight: '600' },
                padding: 15
              }
            }
          }
        }
      });
    },

    /**
     * Calculate weekly sales data
     */
    calculateWeeklySales(orders) {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const salesByDay = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

      orders.forEach(order => {
        const dateStr = order?.submission?.submittedAt || order?.timestamp;
        if (!dateStr) return;
        
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const price = Number(order?.price) || 0;
        
        if (Number.isFinite(dayOfWeek)) {
          salesByDay[dayOfWeek] = (salesByDay[dayOfWeek] || 0) + price;
        }
      });

      return {
        labels: days,
        data: days.map((_, i) => salesByDay[i] || 0)
      };
    },

    /**
     * Calculate top products
     */
    calculateTopProducts(orders) {
      const productCounts = {};

      orders.forEach(order => {
        const items = typeof extractOrderLineItems === 'function'
          ? extractOrderLineItems(order)
          : (Array.isArray(order?.orderDetails) ? order.orderDetails : []);
        if (!Array.isArray(items) || !items.length) return;

        items.forEach(item => {
          const productName = item?.product || item?.name || 'غير محدد';
          const quantity = Number(item?.quantity);
          productCounts[productName] = (productCounts[productName] || 0) + (
            Number.isFinite(quantity) && quantity > 0 ? quantity : 1
          );
        });
      });

      return Object.entries(productCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },

    /**
     * Calculate payment methods distribution
     */
    calculatePaymentMethods(orders) {
      const methods = {
        'الاستلام': 0,
        'فودافون كاش': 0,
        'آخر': 0
      };

      orders.forEach(order => {
        const method = order?.paymentMethod || 'آخر';
        
        if (method.includes('الاستلام')) {
          methods['الاستلام']++;
        } else if (method.includes('فودافون')) {
          methods['فودافون كاش']++;
        } else {
          methods['آخر']++;
        }
      });

      return methods;
    },

    /**
     * Calculate package distribution
     */
    calculatePackageDistribution(orders) {
      const packages = {
        'نصف أسبوعية': 0,
        'أسبوعية': 0,
        'شهرية': 0,
        'غير محدد': 0
      };

      orders.forEach(order => {
        const frequency = order?.frequency || 'غير محدد';
        
        if (frequency.includes('أسبوع') && !frequency.includes('نصف')) {
          packages['أسبوعية']++;
        } else if (frequency.includes('نصف')) {
          packages['نصف أسبوعية']++;
        } else if (frequency.includes('شهر')) {
          packages['شهرية']++;
        } else {
          packages['غير محدد']++;
        }
      });

      return packages;
    }
  };

  // Expose Charts to global scope for other scripts
  window.DashboardCharts = Charts;
})();
