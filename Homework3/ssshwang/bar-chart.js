// bar-chart.js
const createBarChart = async () => {
  // Get actual SVG element size for the bar chart
  const barSvgElement = document.querySelector("#bar-chart-container svg");
  const barFullWidth = barSvgElement.clientWidth;
  const barFullHeight = barSvgElement.clientHeight;
  
  // Chart size and margin setup
  const margin = { top: 50, right: 30, bottom: 70, left: 60 };
  const width = barFullWidth - margin.left - margin.right;
  const height = barFullHeight - margin.top - margin.bottom;

  // Create SVG for bar chart
  const svg = d3.select("#bar-chart-container svg")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  try {
    // Load data
    const data = await d3.csv("data/student-mat.csv");
    
    // Create initial grouped data for study time vs alcohol consumption
    let groupedData = processDataByStudyTime(data);
    
    // Set up scales
    const xScale = d3.scaleBand()
      .domain(["<2 hours", "2-5 hours", "5-10 hours", ">10 hours"])
      .range([0, width])
      .padding(0.3);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(groupedData, d => Math.max(d.avgWalc, d.avgDalc))])
      .range([height, 0])
      .nice();
    
    // Color scale for the bars
    const colorScale = d3.scaleOrdinal()
      .domain(["Weekend Alcohol", "Workday Alcohol"])
      .range(["#FF9671", "#845EC2"]);
    
    // Draw X axis
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "middle");
    
    // Add X axis label
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Weekly Study Time");
    
    // Draw Y axis
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));
    
    // Add Y axis label
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Average Alcohol Consumption (1-5)");
    
    // Calculate the bar width
    const barWidth = xScale.bandwidth() / 2;
    
    // Draw bars for Weekend Alcohol
    const weekendBars = svg.selectAll(".weekend-bar")
      .data(groupedData)
      .enter()
      .append("rect")
      .attr("class", "weekend-bar")
      .attr("x", d => xScale(d.studyTimeLabel))
      .attr("y", d => yScale(d.avgWalc))
      .attr("width", barWidth)
      .attr("height", d => height - yScale(d.avgWalc))
      .attr("fill", colorScale("Weekend Alcohol"))
      .attr("opacity", 0.7);
    
    // Draw bars for Workday Alcohol
    const workdayBars = svg.selectAll(".workday-bar")
      .data(groupedData)
      .enter()
      .append("rect")
      .attr("class", "workday-bar")
      .attr("x", d => xScale(d.studyTimeLabel) + barWidth)
      .attr("y", d => yScale(d.avgDalc))
      .attr("width", barWidth)
      .attr("height", d => height - yScale(d.avgDalc))
      .attr("fill", colorScale("Workday Alcohol"))
      .attr("opacity", 0.7);
    
    // Add bar chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Study Time vs. Alcohol Consumption");
    
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 180}, 0)`);
    
    // Add legend items
    const legendItems = ["Weekend Alcohol", "Workday Alcohol"];
    
    legendItems.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
      
      legendItem.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colorScale(item))
        .attr("opacity", 0.7);
      
      legendItem.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("font-size", "12px")
        .text(item);
    });
    
    // Function to update the bar chart based on gender filter
    window.updateBarChart = function(gender) {
      let filteredData;
      
      if (gender === "all") {
        filteredData = processDataByStudyTime(data);
      } else {
        filteredData = processDataByStudyTime(data.filter(d => d.sex === gender));
      }
      
      // Update y-scale domain
      yScale.domain([0, d3.max(filteredData, d => Math.max(d.avgWalc, d.avgDalc))]).nice();
      
      // Update y-axis with animation
      svg.select(".y-axis")
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));
      
      // Update Weekend Alcohol bars
      weekendBars.data(filteredData)
        .transition()
        .duration(750)
        .attr("y", d => yScale(d.avgWalc))
        .attr("height", d => height - yScale(d.avgWalc));
      
      // Update Workday Alcohol bars
      workdayBars.data(filteredData)
        .transition()
        .duration(750)
        .attr("y", d => yScale(d.avgDalc))
        .attr("height", d => height - yScale(d.avgDalc));
      
      // Update title to reflect the filtered data
      const titleText = gender === "all" 
        ? "Study Time vs. Alcohol Consumption" 
        : `Study Time vs. Alcohol Consumption (${gender === "F" ? "Female" : "Male"} Students)`;
      
      svg.select(".chart-title")
        .transition()
        .duration(750)
        .text(titleText);
    };
    
    // Helper function to process data by study time
    function processDataByStudyTime(inputData) {
      const studyTimeLabels = {
        1: "<2 hours",
        2: "2-5 hours",
        3: "5-10 hours",
        4: ">10 hours"
      };
      
      // Group data by study time
      const groupedByStudyTime = d3.nest()
        .key(d => d.studytime)
        .rollup(values => ({
          avgWalc: d3.mean(values, d => +d.Walc),
          avgDalc: d3.mean(values, d => +d.Dalc),
          count: values.length
        }))
        .entries(inputData);
      
      // Format data for the chart
      return groupedByStudyTime.map(d => ({
        studyTime: d.key,
        studyTimeLabel: studyTimeLabels[d.key],
        avgWalc: d.value.avgWalc,
        avgDalc: d.value.avgDalc,
        count: d.value.count
      }));
    }
    
    // Initial animation - bars grow from bottom
    weekendBars
      .attr("y", height)
      .attr("height", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("y", d => yScale(d.avgWalc))
      .attr("height", d => height - yScale(d.avgWalc));
    
    workdayBars
      .attr("y", height)
      .attr("height", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 400) // Stagger after weekend bars
      .attr("y", d => yScale(d.avgDalc))
      .attr("height", d => height - yScale(d.avgDalc));
    
  } catch (error) {
    console.error("Data loading error:", error);
    d3.select("#bar-chart-container svg")
      .append("text")
      .attr("x", barFullWidth / 2)
      .attr("y", barFullHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "red")
      .text("Error loading data");
  }
};

// Create bar chart when page loads
document.addEventListener("DOMContentLoaded", createBarChart);