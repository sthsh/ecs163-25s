 let BPMFilter = 300;
 let AgeFilter = 0;
 let AgeFilterUp =90;
var frequency = {
    "Never":0,
    "Rarely":1,
    "Sometimes":2,
    "Very frequently": 3
}
const width = window.innerWidth;
const height = window.innerHeight;

//Below borrowed from https://d3-graph-gallery.com/graph/custom_theme.html and modified
var color = d3.scaleOrdinal()
.domain(["Improve", "No effect", "", "No Answer"])
.range([ "#00bfff", "#ffa200", "#cfcfcf", "#cfcfcf"])

let scatterLeft = 0, scatterTop = 30;
let scatterMargin = {top: 10, right: 30, bottom: 30, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let barLeft = 400, barTop = 30;
let barMargin = {top: 10, right: 30, bottom: 30, left: 80},
    barWidth = 400 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.top - barMargin.bottom;

let paraLeft = 0, paraTop = 450;
let paraMargin = {top: 10, right: 30, bottom: 30, left: 60},
    paraWidth = width - paraMargin.left - paraMargin.right,
    paraHeight = height -450 - paraMargin.top - paraMargin.bottom;

// plots
d3.csv("mxmh_survey_results.csv").then(rawData =>{
    //console.log("rawData", rawData);
    rawData.forEach(function(d){
        d.Age = Number(d.Age);
        d.HoursPerDay = Number(d["Hours per day"]);
        d.BPM = Number(d.BPM);
        d.Anxiety = Number(d.Anxiety);
        d.Depression = Number(d.Depression);
        d.Insomnia = Number(d.Insomnia);
        d.OCD = Number(d.OCD);

        d["Frequency [Classical]"] = frequency[d["Frequency [Classical]"]];
        d["Frequency [Country]"] = frequency[d["Frequency [Country]"]];
        d["Frequency [EDM]"] = frequency[d["Frequency [EDM]"]];
        d["Frequency [Folk]"]= frequency[d["Frequency [Folk]"]];
        d["Frequency [Gospel]"] = frequency[d["Frequency [Gospel]"]];
        d["Frequency [Hip hop]"] = frequency[d["Frequency [Hip hop]"]];
        d["Frequency [Jazz]"] = frequency[d["Frequency [Jazz]"]];        
        d["Frequency [K pop]"] = frequency[d["Frequency [K pop]"]];   
        d["Frequency [Latin]"] = frequency[d["Frequency [Latin]"]];   
        d["Frequency [Lofi]"] = frequency[d["Frequency [Lofi]"]];   
        d["Frequency [Metal]"] = frequency[d["Frequency [Metal]"]];   
        d["Frequency [Pop]"] = frequency[d["Frequency [Pop]"]];   
        d["Frequency [R&B]"] = frequency[d["Frequency [R&B]"]];        
        d["Frequency [Rap]"] = frequency[d["Frequency [Rap]"]];
        d["Frequency [Rock]"] = frequency[d["Frequency [Rock]"]];
        d["Frequency [Video game music]"] = frequency[d["Frequency [Video game music]"]];
    });

    const filteredData = rawData.filter(d=>d.BPM<BPMFilter && d.Age>AgeFilter && d.Age<AgeFilterUp);
    const processedData = filteredData;
    /*
    const processedData = rawData.map(d=>{
                          return {
                              "H_AB":d.H/d.AB,
                              "SO_AB":d.SO/d.AB,
                              "teamID":d.teamID,
                          };
    });
    console.log("processedData", processedData);
    */
   console.log("rawData", rawData);

    //plot 1: Parallel Chart for overview
    //Code borrowed from https://d3-graph-gallery.com/graph/parallel_basic.html and modified
    //Also borrowed from https://d3-graph-gallery.com/graph/parallel_custom.html and modified    
    const svg = d3.select("svg");
    const g1 = svg.append("g")
                .attr("width", paraWidth + paraMargin.left + paraMargin.right)
                .attr("height", paraHeight + paraMargin.top + paraMargin.bottom)
                .attr("transform", `translate(${paraLeft}, ${paraTop})`);
                
    dimensions = ["Age","BPM","Hours per day","Anxiety","Depression","Insomnia","OCD"]

    // For each dimension, I build a linear scale. I store all in a y object
    var y1 = {}
    for (i in dimensions) {
        let name = dimensions[i]
        y1[name] = d3.scaleLinear()
        .domain( d3.extent(processedData, function(d) { return +d[name]; }) )
        .range([paraHeight, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    x1 = d3.scalePoint()
        .range([0, width])
        .padding(1)
        .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x1(p), y1[p](d[p])]; }));
    }

    var color2 = d3.scaleLinear()
        .domain([10,30,50,70,90])
        .range(["#e60000","#fff200","#00ff00","#00bfff","#a200ff"])

    // Draw the lines
    g1.selectAll("myPath")
        .data(processedData)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", function(d){ return color2(d.Age)})
        .style("opacity", 0.5)

    // Draw the axis:
    g1.selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x1(d) + ")"; })
        // And I build the axis with the call function
        .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y1[d])); })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black");

    g1.append("text")
    .attr("x", (paraWidth +paraMargin.left) / 2 )
    .attr("y", -30)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Context view");

    //plot 2: Scatter Plot
    const g2 = svg.append("g")
                .attr("transform", `translate(${scatterMargin.left + scatterLeft}, ${scatterTop + scatterMargin.top})`);
               
    // X label
    g2.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("BPM");
    // Y label
    g2.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Hours Per Day");

    // X ticks
    const x2 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.BPM)])
    .range([0, scatterWidth]);

    const xAxisCall = d3.axisBottom(x2)
                        .ticks(7);
    g2.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y2 = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.HoursPerDay)])
    .range([scatterWidth, 0]);

    const yAxisCall = d3.axisLeft(y2)
                        .ticks(12);
    g2.append("g").call(yAxisCall);

    // circles
    const circles = g2.selectAll("circle").data(processedData);

    circles.enter().append("circle")
         .attr("cx", d => x2(d.BPM))
         .attr("cy", d => y2(d.HoursPerDay))
         .attr("r", 3)
         .attr("fill", function (d) { return color(d["Music effects"])            
         });

    //Below Code borrowed from https://d3-graph-gallery.com/graph/custom_legend.html and modified
        var size = 15
        g2.append("text")
            .attr("x",300)
            .attr("y",20)
            .text("Music Effects")
            .attr("text-anchor", "middle");

        g2.selectAll("mydots")
        .data(["Improve", "No effect", "" ])
        .enter()
        .append("rect")
            .attr("x", 260)
            .attr("y", function(d,i){ return 30 + i*(size+5)}) 
            .attr("width", size)
            .attr("height", size)
            .style("fill", function(d){ return color(d)});

        g2.selectAll("mylabels")
        .data(["Improve", "No effect", "No Answer" ])
        .enter()
        .append("text")
            .attr("x", 260 + size*1.2)
            .attr("y", function(d,i){ return 30 + i*(size+5) + (size/2)})
            .style("fill", function(d){ return color(d)})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");
         
        g2.append("text")
        .attr("x", (barWidth) / 2 )
        .attr("y", -10)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("BPM/HPD/Music Effects Relation");

    /*
    const teamCounts = processedData.reduce((s, { teamID }) => (s[teamID] = (s[teamID] || 0) + 1, s), {});
    const teamData = Object.keys(teamCounts).map((key) => ({ teamID: key, count: teamCounts[key] }));
    console.log("teamData", teamData);
    */

    // Bar Chart 
    const g3 = svg.append("g")
                .attr("transform", `translate(${barMargin.left + barLeft}, ${barTop + barMargin.top})`);

    var groups =  ["Anxiety","Depression","Insomnia","OCD"];

    // X label
    g3.append("text")
    .attr("x", barWidth / 2)
    .attr("y", barHeight + 50)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Mental Illness");

    // Y label
    g3.append("text")
    .attr("x", -(barHeight / 2))
    .attr("y", -40)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Intensity");

    // X ticks
    const x3 = d3.scaleBand()
    .domain(groups)
    .range([0, barWidth])
    .paddingInner(0.3)
    .paddingOuter(0.2);

    const xAxisCall3 = d3.axisBottom(x3);
    g3.append("g")
    .attr("transform", `translate(0, ${barHeight})`)
    .call(xAxisCall3)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "10")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-15)");

    // Y ticks
    const y3 = d3.scaleLinear()
    .domain([0, 10])
    .range([barHeight, 0])
    .nice();

    const yAxisCall3 = d3.axisLeft(y3)
                        .ticks(10);
    g3.append("g").call(yAxisCall3);

    const avgAnxiety = d3.mean(processedData, d=>d.Anxiety);
    const avgDepression = d3.mean(processedData, d=>d.Depression);
    const avgInsomnia = d3.mean(processedData, d=>d.Insomnia);
    const avgOCD = d3.mean(processedData, d=>d.OCD);
    const avgDict = {"Anxiety":avgAnxiety, "Depression":avgDepression, "Insomnia":avgInsomnia, "OCD":avgOCD};

    //Below code borrowed from https://d3-graph-gallery.com/graph/barplot_basic.html and modified
    g3.selectAll("mybars")
        .data(groups)
        .enter()
        .append("rect")
            .attr("x", d => x3(d))
            .attr("y", d => y3(avgDict[d]))
            .attr("width", x3.bandwidth())
            .attr("height", d => barHeight -y3(avgDict[d]))
            .attr("fill", "steelblue");
         
    g3.append("text")
    .attr("x", (barWidth) / 2 )
    .attr("y", -10)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Mental Illness Intensity Bar Chart");
    })
    .catch(function(error){
    console.log(error);
});