const width = window.innerWidth;
const height = window.innerHeight;

let heatmapLeft = 0, heatmapTop = 50;
let heatmapMargin = {top: 60, right: 50, bottom: 80, left: 100},
    heatmapWidth = width - heatmapMargin.left - heatmapMargin.right,
    heatmapHeight = height * 0.5 - heatmapMargin.top - heatmapMargin.bottom;

let scatterLeft = 0, scatterTop = height * 0.5 + 30;
let scatterMargin = {top: 60, right: 50, bottom: 80, left: 100},
    scatterWidth = width - scatterMargin.left - scatterMargin.right,
    scatterHeight = height * 0.5 - 30 - scatterMargin.top - scatterMargin.bottom;

let pokemonData = [];

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
        .attr("fill", "#2a75bb")
        .text("Pokemon Data Visualization Dashboard");
    const heatmapGroup = svg.append("g")
        .attr("transform", `translate(${heatmapMargin.left}, ${heatmapTop + heatmapMargin.top})`);
    
    const scatterGroup = svg.append("g")
        .attr("transform", `translate(${scatterMargin.left}, ${scatterTop + scatterMargin.top})`);
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", heatmapTop + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("fill", "#3c5aa6")
        .text("Pokemon Type_1 Distribution by Generation (Overview)");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", scatterTop + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("fill", "#3c5aa6")
        .text("Pokemon Physical Attributes vs Stats (Type 1 & Type 2)");

    createHeatmap(heatmapGroup, heatmapWidth, heatmapHeight);
    createScatterPlot(scatterGroup, scatterWidth, scatterHeight);
    
}).catch(error => {
    console.error("Error loading data:", error);
});

//HEATMAP
function createHeatmap(svg, width, height) {

    const types = Array.from(new Set(pokemonData.map(d => d.Type_1))).sort();
    const generations = Array.from(new Set(pokemonData.map(d => d.Generation))).sort((a, b) => a - b);

    const heatmapData = [];
    types.forEach(type => {
        generations.forEach(gen => {
            const count = pokemonData.filter(d => d.Type_1 === type && d.Generation === gen).length;
            heatmapData.push({ type, generation: gen, count });
        });
    });
    
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
    const legendWidth = 300;
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
        .text("Number of Pokémon");
    
    svg.append("text")
        .attr("x", 10)
        .attr("y", height + 50)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text("Note: Some types were not introduced in early generations (e.g., Steel and Dark were added in Gen 2)");
}

//SCATTER 
function createScatterPlot(svg, width, height) {
    const xMetric = "Weight_kg";
    const yMetric = "Total";
    
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
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Base Stats");
    
    const dotsGroup = svg.append("g")
        .attr("class", "dots-group");
    
    dotsGroup.selectAll(".dot-type1")
        .data(pokemonData)
        .join("circle")
        .attr("class", "dot-type1")
        .attr("cx", d => xScale(d[xMetric]))
        .attr("cy", d => yScale(d[yMetric]))
        .attr("r", 8)
        .attr("fill", d => typeColors[d.Type_1])
        .attr("opacity", 0.7)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    
    dotsGroup.selectAll(".dot-type2")
        .data(pokemonData.filter(d => d.Type_2))
        .join("circle")
        .attr("class", "dot-type2")
        .attr("cx", d => xScale(d[xMetric]))
        .attr("cy", d => yScale(d[yMetric]))
        .attr("r", 4)
        .attr("fill", d => typeColors[d.Type_2])
        .attr("opacity", 1)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    
    const dualTypeExample = svg.append("g")
        .attr("transform", `translate(${width - 280}, ${height + 40})`);
    
    dualTypeExample.append("circle")
        .attr("r", 8)
        .attr("fill", "#F08030") 
        .attr("opacity", 0.7)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    dualTypeExample.append("circle")
        .attr("r", 4)
        .attr("cx", 20)
        .attr("fill", "#6890F0")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);
    
    dualTypeExample.append("text")
        .attr("x", 35)
        .attr("y", 4)
        .attr("font-size", "12px")
        .text("Large circle: Primary Type (Type 1)");
    
    dualTypeExample.append("text")
        .attr("x", 35)
        .attr("y", 20)
        .attr("font-size", "12px")
        .text("Small circle: Secondary Type (Type 2)");

    createTypeLegend(svg, width);

    svg.append("text")
        .attr("x", 20)
        .attr("y", height + 40)
        .attr("font-size", "12px")
        .text("Note: Scatter plot shows relationship between Weight and Total Base Stats");
}

function createTypeLegend(svg, width) {
    const typeCounts = {};
    pokemonData.forEach(d => {
        typeCounts[d.Type_1] = (typeCounts[d.Type_1] || 0) + 1;
    });
    
    const topTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(d => d[0]);
    
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - 140}, 10)`);
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("Common Types");
    
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
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", 10 * 20 + 10)
        .attr("font-size", "11px")
        .text("Large stats often");
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", 10 * 20 + 25)
        .attr("font-size", "11px")
        .text("indicate legendary");
    
    legendGroup.append("text")
        .attr("x", 0)
        .attr("y", 10 * 20 + 40)
        .attr("font-size", "11px")
        .text("Pokémon");
}