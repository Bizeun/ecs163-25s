// parallel-coordinates.js

const createParallelCoordinates = async () => {
  // Get actual SVG element size
  const svgElement = document.querySelector("#parallel-coords-container svg");
  const fullWidth = svgElement.clientWidth;
  const fullHeight = svgElement.clientHeight;
  
  // Chart size and margin setup
  const margin = { top: 50, right: 50, bottom: 40, left: 50 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  // Create SVG for parallel coordinates
  const svg = d3.select("#parallel-coords-container svg")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  createParallelCoordsUI();

  try {
    // Load data
    const data = await d3.csv("data/student-mat.csv");
    
    // Define the dimensions to visualize
    // Default set of dimensions
    let dimensions = ["studytime", "freetime", "goout", "Walc", "Dalc", "G3"];
    
    // Define labels for each dimension
    const dimensionLabels = {
      "studytime": "Study Time",
      "freetime": "Free Time",
      "goout": "Going Out",
      "Walc": "Weekend Alcohol",
      "Dalc": "Workday Alcohol",
      "G3": "Final Grade",
      "G1": "First Period Grade",
      "G2": "Second Period Grade",
      "absences": "Absences",
      "health": "Health Status",
      "famrel": "Family Relationship"
    };
    
    // Create a new array with all possible dimensions for the dropdown
    const allDimensions = Object.keys(dimensionLabels);
    
    // Create scales for each dimension
    const y = {};
    for (let dimension of allDimensions) {
      // For each dimension, create a linear scale
      y[dimension] = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[dimension]))
        .range([height, 0]);
    }
    
    // Build the X scale -> position of each axis
    const x = d3.scalePoint()
      .range([0, width])
      .domain(dimensions);
    
    // Line generator
    const line = d3.line()
      .defined(d => !isNaN(d[1]))
      .x(d => x(d[0]))
      .y(d => y[d[0]](+d[1]));
    
    // Function to convert data row to line format
    function pathFor(d) {
      return line(dimensions.map(p => [p, d[p]]));
    }
    
    // Color scale for the lines
    const colorScale = d3.scaleLinear()
      .domain(d3.extent(data, d => +d.G3))
      .range(["#FF5C8D", "#2E86C1"]);
    
    // Draw the lines
    const paths = svg.append("g")
      .attr("class", "lines")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", pathFor)
      .attr("fill", "none")
      .attr("stroke", d => colorScale(+d.G3))
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.5)
      .on("mouseover", function(d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .attr("opacity", 1);
      })
      .on("mouseout", function(d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.5);
      });
    
    // Initial animation - draw lines from left to right
    paths
      .attr("stroke-dasharray", function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);
    
    // Create axes
    const axes = svg.selectAll(".axis")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("class", "axis")
      .attr("transform", d => `translate(${x(d)}, 0)`)
      .each(function(d) {
        d3.select(this).call(d3.axisLeft(y[d]));
      });
    
    // Add axis labels
    axes.append("text")
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", "12px")
      .text(d => dimensionLabels[d]);
    
    // Add chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Parallel Coordinates View of Student Attributes");
    
    // Create dropdown for dimension selection
    const dropdownContainer = d3.select("#dimension-selector");

    const dimensionGroups = dropdownContainer.selectAll(".dimension-group")
      .data(dimensions)
      .enter()
      .append("div")
      .attr("class", "dimension-group");
    
    // Add label for each dropdown
    dimensionGroups.append("span")
      .attr("class", "dimension-label")
      .text((d, i) => `Dimension ${i+1}: `);

    const dropdowns = dimensionGroups.append("select")
      .attr("class", "dimension-dropdown")
      .attr("data-index", (d, i) => i)
      .on("change", updateDimension);

    // Create dropdown for changing dimensions
    dropdowns.each(function(d,i){
      const select = d3.select(this);
      select.selectAll("option")
        .data(allDimensions)
        .enter()
        .append("option")
        .attr("value", option => option)
        .property("selected", option => option === d)
        .text(option => dimensionLabels[option]);
    })
    
    // Function to update dimension
    function updateDimension() {
      const index = +d3.select(this).attr("data-index");
      const newDimension = this.value;
      
      dimensions[index] = newDimension;
      
      // Update x scale domain
      x.domain(dimensions);

      svg.selectAll(".axis").remove();
      
      // Transition axes
      const newAxes = svg.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", d => `translate(${x(d)}, 0)`)
        .each(function(d) {
          d3.select(this).call(d3.axisLeft(y[d]));
        });
      
      
      // Update axis labels
      newAxes.append("text")
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .style("font-size", "12px")
        .text(d => dimensionLabels[d]);
      
      // Transition lines
      svg.selectAll(".lines path")
        .transition()
        .duration(1000)
        .attr("d", pathFor);
    }
    
    // Function to filter data by grade range
    window.filterByGrade = function(minGrade, maxGrade) {
      // Filter data
      const filteredData = data.filter(d => +d.G3 >= minGrade && +d.G3 <= maxGrade);
      
      // Update lines
      const updatedPaths = svg.selectAll(".lines path")
        .data(filteredData);
      
      // Remove lines that don't match filter
      updatedPaths.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();
      
      // Update existing lines
      updatedPaths
        .transition()
        .duration(500)
        .attr("d", pathFor)
        .attr("stroke", d => colorScale(+d.G3));
      
      // Add new lines
      updatedPaths.enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(+d.G3))
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .attr("d", pathFor)
        .transition()
        .duration(500)
        .attr("opacity", 0.5);
    };
    
    // Initialize grade filter slider
    const gradeSlider = document.getElementById("grade-filter");
    const gradeOutput = document.getElementById("grade-value");
    
    if (gradeSlider && gradeOutput) {
      gradeSlider.oninput = function() {
        const value = this.value;
        gradeOutput.innerHTML = value;
        filterByGrade(value, 20); // Filter from selected value to max grade (20)
      };
    }
    
  } catch (error) {
    console.error("Data loading error:", error);
    d3.select("#parallel-coords-container svg")
      .append("text")
      .attr("x", fullWidth / 2)
      .attr("y", fullHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "red")
      .text("Error loading data");
  }
};

function createParallelCoordsUI() {
  const container = d3.select("#parallel-coords-container");
  let hideTimer;
  
  // Create toggle button
  const toggleButton = container.append("div")
    .attr("class", "dimension-toggle")
    .style("position", "absolute")
    .style("bottom", "20px")
    .style("left", "50%")
    .style("transform", "translateX(-50%)")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("padding", "8px 15px")
    .style("border-radius", "5px")
    .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
    .style("cursor", "pointer")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("border", "1px solid #ccc")
    .style("transition", "all 0.3s ease")
    .style("z-index", "150")
    .text("Dimension Selection")
    .on("click", toggleControls)
    .on("mouseenter", showControls)
    .on("mouseleave", startHideTimer);
  
  // Create controls container
  const controlsContainer = container.append("div")
    .attr("class", "controls-container")
    .style("position", "absolute")
    .style("bottom", "60px")
    .style("left", "50%")
    .style("transform", "translateX(-50%)")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("padding", "15px")
    .style("border-radius", "8px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
    .style("z-index", "140")
    .style("display", "none")
    .style("width", "fit-content")
    .style("max-width", "90%")
    .on("mouseenter", cancelHideTimer)
    .on("mouseleave", startHideTimer);
  
  // Create grade filter container
  const gradeFilterContainer = controlsContainer.append("div")
    .attr("id", "grade-filter-container")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin-bottom", "15px")
    .style("width", "300px");
  
  gradeFilterContainer.append("label")
    .attr("for", "grade-filter")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("margin-right", "10px")
    .text("Min Grade:");
  
  gradeFilterContainer.append("input")
    .attr("type", "range")
    .attr("id", "grade-filter")
    .attr("min", "0")
    .attr("max", "20")
    .attr("value", "0")
    .attr("step", "1")
    .style("flex-grow", "1")
    .style("margin", "0 10px");
  
  gradeFilterContainer.append("span")
    .attr("id", "grade-value")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("min-width", "20px")
    .style("text-align", "center")
    .text("0");

  controlsContainer.append("div")
    .attr("id", "dimension-selector")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "8px")
    .style("width", "fit-content");
  
  // Helper functions
  function toggleControls() {
    const container = document.querySelector('.controls-container');
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
  }
  
  function showControls() {
    cancelHideTimer();
    const container = document.querySelector('.controls-container');
    container.style.display = 'block';
  }
  
  function startHideTimer() {
    hideTimer = setTimeout(() => {
      const container = document.querySelector('.controls-container');
      container.style.display = 'none';
    }, 500);
  }
  
  function cancelHideTimer() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }
  
  // Add CSS for dimension groups
  const style = document.createElement('style');
  style.textContent = `
    .dimension-group {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 5px;
    }
    .dimension-label {
      font-size: 12px;
      font-weight: bold;
      min-width: 80px;
      font-family: sans-serif;
    }
    .dimension-dropdown {
      padding: 4px;
      border-radius: 3px;
      border: 1px solid #ccc;
      font-size: 12px;
      min-width: 120px;
    }
    .dimension-toggle:hover {
      background: rgba(255, 255, 255, 1) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }
  `;
  document.head.appendChild(style);
}


// Create parallel coordinates when page loads
document.addEventListener("DOMContentLoaded", createParallelCoordinates);

window.addEventListener("resize", () => {
  d3.select("svg").selectAll("*").remove();
  createScatterPlot();
});