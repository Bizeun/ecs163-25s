// main.js file content

// Scatter plot overview visualization
// Shows the relationship between weekend alcohol consumption (Walc) and final grades (G3)
// Point size represents absences, color represents gender (sex)

const createScatterPlot = async () => {
  // Get actual SVG element size
  const svgElement = document.querySelector("#scatter-plot-container svg");
  const fullWidth = svgElement.clientWidth;
  const fullHeight = svgElement.clientHeight;
  
  let currentXVariable = "Walc";

  // Chart size and margin setup
  const margin = { top: 60, right: 80, bottom: 80, left: 80 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  // Select SVG
  const svg = d3.select("#scatter-plot-container svg")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Load data
  try {
    // D3 v5 uses Promises
    const data = await d3.csv("data/student-mat.csv");
    
    // Set up scales
    const xScale = d3.scaleLinear()
      .domain([0, 5]) // Walc range: 1-5
      .range([0, width])
      .nice();
    
    const yScale = d3.scaleLinear()
      .domain([0, 20]) // G3 range: 0-20
      .range([height, 0])
      .nice();
    
    // Scale for point size based on absences (limit max value)
    const absMax = d3.max(data, d => +d.absences);
    const sizeScale = d3.scaleLinear()
      .domain([0, Math.min(absMax, 30)]) // Limit to max 30
      .range([3, 15]);
    
    // Color scale (based on gender)
    const colorScale = d3.scaleOrdinal()
      .domain(["F", "M"])
      .range(["#FF5C8D", "#2E86C1"]);
    
    // Add background rectangle (for interaction)
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f9f9f9")
      .attr("rx", 8)
      .attr("ry", 8);
    
    // Draw X-axis
    const xAxis = svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));
    
    // Add X-axis label that will update
    const xAxisLabel = xAxis.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Weekend Alcohol Consumption (1-5)");
    
    
    // Draw Y-axis
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Final Grade (0-20)");
    
    // Add grid lines
    svg.append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5);
    
    // Add group for absence labels

    const absenceLabelBg = svg.append("g")
        .attr("class", "absence-label-bg");
    const absenceLabels = svg.append("g")
        .attr("class", "absence-labels");

    // Add data points
    const points = svg.append("g")
      .attr("class", "points")
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(+d[currentXVariable]))
      .attr("cy", d => yScale(+d.G3))
      .attr("r", d => sizeScale(+d.absences))
      .attr("fill", d => colorScale(d.sex))
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("data-id", (d, i) => i); // Add unique ID
    
    // Add tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none");
    
    // Variable to track selected data point
    let selectedPoint = null;
    
    function updateXVariable(newVariable) {
      if (newVariable === currentXVariable) return; // No change needed
      
      currentXVariable = newVariable;
      // Update x-axis label
      const labelText = newVariable === "Walc" 
        ? "Weekend Alcohol Consumption (1-5)" 
        : "Workday Alcohol Consumption (1-5)";
      
      xAxisLabel
        .transition()
        .duration(750)
        .text(labelText);
      
      // Animate data points to new positions
      points
        .transition()
        .duration(750)
        .attr("cx", d => xScale(+d[currentXVariable]));
      
      // Clear any selected point and labels
      if (selectedPoint) {
        d3.select(selectedPoint)
          .transition()
          .duration(200)
          .attr("r", d => sizeScale(+d.absences))
          .attr("opacity", 0.7)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
        
        absenceLabels.selectAll("text").remove();
        absenceLabelBg.selectAll("rect").remove();
        selectedPoint = null;
      }
    }
    
    // Add event listeners to radio buttons
    d3.selectAll('input[name="x-variable"]')
      .on("change", function() {
        updateXVariable(this.value);
      });

    // Add mouse events
    points
      .on("mouseover", function(d) {
        // Only enlarge if not the selected point
        if (this !== selectedPoint) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+d.absences) + 2)
            .attr("opacity", 1);
        }
        
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        
        tooltip.html(`
          <strong>Gender:</strong> ${d.sex === 'F' ? 'Female' : 'Male'}<br/>
          <strong>Age:</strong> ${d.age}<br/>
          <strong>Weekend Alcohol:</strong> ${d.Walc}/5<br/>
          <strong>Workday Alcohol:</strong> ${d.Dalc}/5<br/>
          <strong>Final Grade:</strong> ${d.G3}/20<br/>
          <strong>Absences:</strong> ${d.absences}<br/>
          <strong>Study Time:</strong> ${d.studytime}/4
        `)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        // Only shrink if not the selected point
        if (this !== selectedPoint) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+d.absences))
            .attr("opacity", 0.7);
        }
        
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", function(d) {
        d3.event.stopPropagation(); // Prevent event bubbling
        
        // Clear all labels
        absenceLabels.selectAll("text").remove();
        absenceLabelBg.selectAll("rect").remove();
        
        // If there was a previously selected point, reset its style
        if (selectedPoint && selectedPoint !== this) {
            const prevData = d3.select(selectedPoint).datum();
            d3.select(selectedPoint)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+prevData.absences))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
        }
        
        // If clicking the same point again, deselect it
        if (selectedPoint === this) {
            selectedPoint = null;
            d3.select(this)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+d.absences))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
            return;
        }
        
        // Select new point
        selectedPoint = this;
        
        // Change style of selected point
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+d.absences) + 3)
            .attr("opacity", 1)
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
        
        // Add absence label with improved positioning
        absenceLabels.append("text")
            .attr("x", xScale(+d[currentXVariable]))
            .attr("y", () => {
            const circleRadius = sizeScale(+d.absences) + 3;
            return yScale(+d.G3) - circleRadius - 8; // Position above the circle
            })
            .attr("text-anchor", "middle")
            .attr("fill", "#000")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text(`Absences: ${d.absences}`);
        });
    
    // Deselect on background click
    svg.select("rect")
      .on("click", function() {
        if (selectedPoint) {
          const prevData = d3.select(selectedPoint).datum();
          d3.select(selectedPoint)
            .transition()
            .duration(200)
            .attr("r", sizeScale(+prevData.absences))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5);
          
          // Clear all labels
          absenceLabels.selectAll("text").remove();
          absenceLabelBg.selectAll("rect").remove();
          
          selectedPoint = null;
        }
        });
    
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 120}, 10)`);
    
    // Gender legend
    const genderLegend = legend.append("g")
      .attr("class", "gender-legend");
    
    genderLegend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Gender");
    
    const genderItems = genderLegend.selectAll(".gender-item")
      .data(["F", "M"])
      .enter()
      .append("g")
      .attr("class", "gender-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20 + 15})`);
    
    genderItems.append("circle")
      .attr("r", 6)
      .attr("fill", d => colorScale(d));
    
    genderItems.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .text(d => d === "F" ? "Female" : "Male");
    
    // Absence legend
    const absenceLegend = legend.append("g")
      .attr("class", "absence-legend")
      .attr("transform", "translate(0, 70)");
    
    absenceLegend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Absences");
    
    const absenceValues = [0, 10, 20];
    const absenceItems = absenceLegend.selectAll(".absence-item")
      .data(absenceValues)
      .enter()
      .append("g")
      .attr("class", "absence-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20 + 15})`);
    
    absenceItems.append("circle")
      .attr("r", d => sizeScale(d))
      .attr("fill", "black");
    
    absenceItems.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .text(d => d);
    
    // Add chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Relationship Between Weekend Alcohol Consumption and Academic Performance");
    
    // Add click instruction text
    svg.append("text")
      .attr("class", "instruction-text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-style", "italic")
      .text("* Click on a circle to see the number of absences");
    
  } catch (error) {
    console.error("Data loading error:", error);
    d3.select("svg")
      .append("text")
      .attr("x", fullWidth / 2)
      .attr("y", fullHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "red")
      .text("Error loading data");
  }
};

// Create chart when page loads
document.addEventListener("DOMContentLoaded", createScatterPlot);

// Redraw chart when browser size changes
window.addEventListener("resize", () => {
  d3.select("svg").selectAll("*").remove();
  createScatterPlot();
});