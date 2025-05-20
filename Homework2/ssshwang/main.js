//ECS-163 Hw2 - Sukhyun Hwang

const width = window.innerWidth;
const height = window.innerHeight;

//Configure heatmap positioning and dimensions (left side of screen)
//Configure scatter plot positioning and dimensions (top-right)
//Configure star plot positioning and dimensions (bottom-right)
let heatmapLeft = 0, heatmapTop = 50;
let heatmapMargin = {top: 60, right: 50, bottom: 80, left: 100},
    heatmapWidth = width * 0.5 - heatmapMargin.left - heatmapMargin.right,
    heatmapHeight = height - 100 - heatmapMargin.top - heatmapMargin.bottom;

let scatterLeft = width * 0.5, scatterTop = 50;
let scatterMargin = {top: 60, right: 150, bottom: 80, left: 50},
    scatterWidth = width * 0.5 - scatterMargin.left - scatterMargin.right,
    scatterHeight = (height - 100) * 0.5 - scatterMargin.top - scatterMargin.bottom;

let starPlotLeft = width * 0.5, starPlotTop = 50 + (height - 100) * 0.5;
let starPlotMargin = {top: 60, right: 50, bottom: 80, left: 60},
    starPlotWidth = width * 0.5 - starPlotMargin.left - starPlotMargin.right,
    starPlotHeight = (height - 100) * 0.5 - starPlotMargin.top - starPlotMargin.bottom;

let pokemonData = [];

//Define standard Pokemon type colors based on official game color scheme
const typeColors = {
    "Normal": "#A8A878",
    "Fire": "#F08030",
    "Water": "#6890F0",
    "Grass": "#78C850",
    "Electric": "#F8D030",
    "Ice": "#98D8D8",
    "Fighting": "#C03028",
    "Poison": "#A040A0",
    "Ground": "#E0C068",
    "Flying": "#A890F0",
    "Psychic": "#F85888",
    "Bug": "#A8B820",
    "Rock": "#B8A038",
    "Ghost": "#705898",
    "Dragon": "#7038F8",
    "Dark": "#705848",
    "Steel": "#B8B8D0",
    "Fairy": "#F0B6BC"
};

//Load and process the Pokemon dataset
d3.csv("data/pokemon_alopez247.csv").then(data => {
    console.log("Pokemon data loaded successfully");
    data.forEach(d => {
        d.Number = +d.Number;
        d.Total = +d.Total;
        d.HP = +d.HP;
        d.Attack = +d.Attack;
        d.Defense = +d.Defense;
        d.Sp_Atk = +d.Sp_Atk;
        d.Sp_Def = +d.Sp_Def;
        d.Speed = +d.Speed;
        d.Generation = +d.Generation;
        d.isLegendary = d.isLegendary === "True";
        d.hasGender = d.hasGender === "True";
        d.Pr_Male = +d.Pr_Male;
        d.hasMegaEvolution = d.hasMegaEvolution === "True";
        d.Height_m = +d.Height_m;
        d.Weight_kg = +d.Weight_kg;
        d.Catch_Rate = +d.Catch_Rate;
    });
    pokemonData = data;
    const svg = d3.select("svg");
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .append("tspan")
            .attr("fill", "#FFD700") 
            .text("Pokemon ")
        .append("tspan")
            .attr("fill", "black")
            .text("Data Visualization Dashboard");

    const heatmapGroup = svg.append("g")
        .attr("transform", `translate(${heatmapLeft + heatmapMargin.left}, ${heatmapTop + heatmapMargin.top})`);
    
    const scatterGroup = svg.append("g")
        .attr("transform", `translate(${scatterLeft + scatterMargin.left}, ${scatterTop + scatterMargin.top})`);
    
    const starPlotGroup = svg.append("g")
        .attr("transform", `translate(${starPlotLeft + starPlotMargin.left}, ${starPlotTop + starPlotMargin.top})`);
    
    // Add titles for each visualization section
    svg.append("text")
        .attr("x", heatmapLeft + heatmapMargin.left + heatmapWidth / 2)
        .attr("y", heatmapTop + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Pokemon Type Distribution by Generation (Overview)");
    
    svg.append("text")
        .attr("x", scatterLeft + scatterMargin.left + scatterWidth / 2)
        .attr("y", scatterTop + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Pokemon Weight vs Total Stats");
   
    
    createHeatmap(heatmapGroup, heatmapWidth, heatmapHeight);
    createScatterPlot(scatterGroup, scatterWidth, scatterHeight);
    createStarPlot(starPlotGroup, starPlotWidth, starPlotHeight);
    
}).catch(error => {
    console.error("Error loading data:", error);
});

//HEATMAP
function createHeatmap(svg, width, height) {

    const types = Array.from(new Set(pokemonData.map(d => d.Type_1))).sort();
    const generations = Array.from(new Set(pokemonData.map(d => d.Generation))).sort((a, b) => a - b);

    //Create aggregated data for the heatmap by counting Pokemon of each type per generation
    const heatmapData = [];
    types.forEach(type => {
        generations.forEach(gen => {
            const count = pokemonData.filter(d => d.Type_1 === type && d.Generation === gen).length;
            heatmapData.push({ type, generation: gen, count });
        });
    });
    
    //Create scales for x and y axes
    const x = d3.scaleBand()
        .domain(generations)
        .range([0, width])
        .padding(0.01);
    const y = d3.scaleBand()
        .domain(types)
        .range([0, height])
        .padding(0.01);
    const maxCount = d3.max(heatmapData, d => d.count);
    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateYlOrBr)
        .domain([0, maxCount]);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Gen ${d}`))
        .selectAll("text")
        .style("text-anchor", "middle");
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("font-size", "14px")
        .text("Generation");
    
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .style("font-size", "14px")
        .text("Type");

    //Create heatmap cells - each cell represents Pokemon count for a type-generation combination
    svg.selectAll("rect")
        .data(heatmapData)
        .join("rect")
        .attr("x", d => x(d.generation))
        .attr("y", d => y(d.type))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => d.count === 0 ? "#eeeeee" : colorScale(d.count))
        .style("stroke", "#cccccc")
        .style("stroke-width", 0.5);

    svg.selectAll("text.cell-label")
        .data(heatmapData)
        .join("text")
        .attr("class", "cell-label")
        .attr("x", d => x(d.generation) + x.bandwidth() / 2)
        .attr("y", d => y(d.type) + y.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text(d => d.count === 0 ? "0" : d.count);

    //Color gradient legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height + 50;

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
    
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));
    
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(maxCount));
    
    svg.append("rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");
    
    //legend
    const legendScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, legendWidth]);
    
    svg.append("g")
        .attr("transform", `translate(${legendX},${legendY + legendHeight})`)
        .call(d3.axisBottom(legendScale).ticks(5));
    
    svg.append("text")
        .attr("x", legendX + legendWidth / 2)
        .attr("y", legendY - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Pokemon");
    
        const noteX = 20;
        const noteY = height + 50;
        const noteWidth = width / 2 - 40;
        
        svg.append("text")
            .attr("x", noteX)
            .attr("y", noteY)
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .text("Note: Some types were not introduced in early generations")
            .call(wrap, noteWidth);}

//Helper function for text wrapping (multiline text)
function wrap(text, width) {
    text.each(function() {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0,
            tspan = text.text(null).append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}

//SCATTER 
function createScatterPlot(svg, width, height) {
    const xMetric = "Weight_kg";
    const yMetric = "Total";
    
    //Scale of x and y
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(pokemonData, d => d[xMetric]) * 1.05])
        .range([0, width])
        .nice();
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(pokemonData, d => d[yMetric]) * 1.05])
        .range([height, 0])
        .nice();
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Weight (kg)");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Base Stats");
    
    //Create scatter plot points
    //Each point represents a Pokemon, positioned by weight and total stats, colored by type
    svg.selectAll(".dot")
        .data(pokemonData)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d[xMetric]))
        .attr("cy", d => yScale(d[yMetric]))
        .attr("r", 6) 
        .attr("fill", d => typeColors[d.Type_1])
        .attr("opacity", 0.8)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    
    createTypeLegend(svg, width);
    svg.append("text")
        .attr("x", 20)
        .attr("y", height + 60)
        .attr("font-size", "12px")
        .text("Note: Scatter plot shows relationship between Weight and Total Base Stats colored by Primary Type");
}

//Helper function to create a legend for Pokemon types
function createTypeLegend(svg, width) {
    const typeCounts = {};
    pokemonData.forEach(d => {
        typeCounts[d.Type_1] = (typeCounts[d.Type_1] || 0) + 1;
    });
    
    const topTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(d => d[0]);
    
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width +40}, 10)`);
    
    legendGroup.append("text")
        .attr("x", -10)
        .attr("y", -10)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("Primary Types(Top 12)");

    const legendItems = legendGroup.selectAll(".legend-item")
        .data(topTypes)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);
    
    legendItems.append("circle")
        .attr("r", 6)
        .attr("fill", d => typeColors[d])
        .attr("opacity", 0.8)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    
    legendItems.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("font-size", "12px")
        .text(d => d);

    const noteY = topTypes.length * 20 + 15;
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", noteY)
        .attr("font-size", "11px")
        .text("Pokemon with high");
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", noteY + 15)
        .attr("font-size", "11px")
        .text("Total stats are often");
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", noteY + 30)
        .attr("font-size", "11px")
        .text("Legendary Pokeon");
}

//Star Plot
function createStarPlot(svg, width, height) {
    const features = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left + innerWidth/2}, ${margin.top + innerHeight/2})`);
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Average Base Stats by Pokemon Type");
    
    const angleSlice = Math.PI * 2 / features.length;
    const types = Array.from(new Set(pokemonData.map(d => d.Type_1))).sort();
    const maxStats = {}; //Find maximum value for each stat for scaling
    features.forEach(feature => {
        maxStats[feature] = d3.max(pokemonData, d => d[feature]);
    });
    
    // Define the number of circles (grid levels)
    const levels = 5;
    const axisGrid = g.append("g").attr("class", "axis-grid");
    
    // Create circles
    axisGrid.selectAll(".level")
        .data(d3.range(1, levels + 1).reverse())
        .join("circle")
        .attr("class", "level")
        .attr("r", d => radius * d / levels)
        .attr("fill", "none")
        .attr("stroke", "#CDCDCD")
        .attr("stroke-width", 0.5);
    const axes = axisGrid.selectAll(".axis")
        .data(features)
        .join("g")
        .attr("class", "axis");
    
    axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("stroke", "#CDCDCD")
        .attr("stroke-width", 1);

    axes.append("text")
        .attr("class", "axis-label")
        .attr("x", (d, i) => radius * 1.15 * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => radius * 1.15 * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("text-anchor", (d, i) => {
            if (i === 0 || i === features.length / 2) return "middle";
            return i < features.length / 2 ? "start" : "end";
        })
        .attr("dominant-baseline", (d, i) => {
            if (i === 1 || i === 2) return "hanging";
            if (i === 4 || i === 5) return "text-before-edge";
            return "middle";
        })
        .attr("font-size", "12px")
        .text(d => d);
    
    //Calculate average stats for each Pokemon type
    const typeAvgStats = {};
    
    types.forEach(type => {
        const typePokemon = pokemonData.filter(d => d.Type_1 === type);
        
        //Calculate average stats for each feature
        typeAvgStats[type] = {};
        features.forEach(feature => {
            typeAvgStats[type][feature] = d3.mean(typePokemon, d => d[feature]);
        });
    });
    
    // Select specific Pokemon types to display (avoid overcrowding the chart)
    const displayTypes = ["Water", "Fire", "Grass", "Electric", "Psychic", "Dragon"];
    
    const radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => d.value)
        .angle((d, i) => i * angleSlice);
    
    // Draw polygons for each Pokemon type
    displayTypes.forEach((type, i) => {
        const data = features.map(feature => ({
            feature,
            value: radius * (typeAvgStats[type][feature] / maxStats[feature])
        }));
        
        g.append("path")
            .datum(data)
            .attr("class", `radar-area-${type}`)
            .attr("d", radarLine)
            .attr("fill", "none")
            .attr("stroke", typeColors[type])
            .attr("stroke-width", 2);
        
        g.selectAll(`.dot-${type}`)
            .data(data)
            .join("circle")
            .attr("class", `dot-${type}`)
            .attr("cx", (d, i) => d.value * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => d.value * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("r", 4)
            .attr("fill", typeColors[type]);
    });
    
    //Legend
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("Pokemon Types");
    
    //Create legend items for each displayed type
    displayTypes.forEach((type, i) => {
        const legendItem = legendGroup.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
        
        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", typeColors[type])
            .attr("opacity", 0.7);
        
        legendItem.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .attr("font-size", "12px")
            .text(type);
    });
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Star plot compares average base stats for different Pokemon types");
}