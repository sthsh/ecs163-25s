const width = window.innerWidth;
const height = window.innerHeight;

let scatterLeft = 0, scatterTop = 30;
let scatterMargin = {top: 10, right: 30, bottom: 30, left: 60},
    scatterWidth = 550 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let barLeft = 550, barTop = 30;
let barMargin = {top: 10, right: 30, bottom: 30, left: 80},
    barWidth = 400 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.top - barMargin.bottom;

let streamLeft = 0, streamTop = 450;
let streamMargin = {top: 10, right: 30, bottom: 30, left: 60},
    streamWidth = width - streamMargin.left - streamMargin.right,
    streamHeight = height -450 - streamMargin.top - streamMargin.bottom;

var keys = ["Data Analyst","ML Engineer","AI Scientist"]

// plots
d3.csv("ds_salaries.csv").then(rawData =>{
    rawData.forEach(function(d){        
        d.work_year = Number(d.work_year);
        d.salary = Number(d.salary);
        d.salary_in_usd = Number(d.salary_in_usd);
        d.remote_ratio = Number(d.remote_ratio);
    });

    //prepares data for scatter plot
    const rolledUpScatterData = d3.flatRollup(
        rawData,
        v => d3.mean(v, d => d.salary_in_usd),
        d => d.work_year,
        d => d.job_title
    )
    const flattenedScatterData = rolledUpScatterData.map(([work_year, job_title,salary_in_usd]) => ({work_year,job_title,salary_in_usd}));
    //plot 1: Stream Graph for focus view
    const svg = d3.select("svg");
    const g1 = svg.append("g")
                .attr("width", streamWidth + streamMargin.left + streamMargin.right)
                .attr("height", streamHeight + streamMargin.top + streamMargin.bottom)
                .attr("transform", `translate(${streamLeft}, ${streamTop})`);

    //Below Code borrowed from https://d3-graph-gallery.com/graph/streamgraph_template.html and modified
    //converts rawData to preStackData that is used for d3.stack
    const rolledUp2 = d3.rollups(
        rawData,
        v => d3.mean(v, d => d.salary_in_usd),
        d => d.work_year,
        d => d.job_title
    )
    const jobs = [...new Set(rawData.map(d =>d.job_title))];
    var preStackArray = []
    for (let i=0; i<4;i++){
        var loopArray = []
        loopArray.push(rolledUp2[i][0]);

        var rolledUpObj = Object.fromEntries(rolledUp2[i][1]);
        var jobObj = {};
        for(let job of jobs){
            if(rolledUpObj[job]){
                jobObj[job] = rolledUpObj[job];
            }else{
                jobObj[job] = 0;
            }
        }
        loopArray.push(jobObj);
        preStackArray.push(loopArray)
    }
    preStackedData = preStackArray.map(([work_year, job_title])=>({work_year, ...job_title}));
    preStackedData.sort((a, b) => a.work_year - b.work_year);

    //stack the data?
    var stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys)
        (preStackedData)

    // Add X axis
    var x = d3.scaleLinear()
        .domain(d3.extent(preStackedData, function(d) { return d.work_year; }))
        .range([ streamMargin.left + 100, streamWidth -streamMargin.right -100]);
    g1.append("g")
        .attr("transform", "translate(0," + streamHeight*0.8 + ")")
        .call(d3.axisBottom(x).tickSize(-streamHeight*.8).tickValues([2020, 2021, 2022, 2023]))
        .select(".domain").remove()
    // Customization
    g1.selectAll(".tick line").attr("stroke", "#b8b8b8")
    // Add X axis label:
    g1.append("text")
        .attr("text-anchor", "end")
        .attr("x", streamWidth/2)
        .attr("y", streamHeight-30 )
        .text("Time (year)");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain(d3.extent(stackedData.flat(), d => d[1]))
        .range([streamHeight*0.6,streamHeight*0.2]);

    // color palette
    var streamColor = d3.scaleOrdinal()
        .range(d3.schemePaired);        

    // create a tooltip
    var Tooltip = g1
        .append("text")
        .attr("x", 20)
        .attr("y", 0)
        .style("opacity", 1)
        .style("font-size", 17)
    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip.style("opacity", 1)
        d3.selectAll(".myArea").style("opacity", .2)
        d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    var mousemove = function(event,d) {
        grp = d.key
        Tooltip.text(grp)
    }
    var mouseleave = function(d) {
        Tooltip.style("opacity", 0)
        d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
    }
    // Area generator
    var area = d3.area()
        .x(function(d) { return x(d.data.work_year); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })        
        .curve(d3.curveBasis);

    // Show the areas
    g1.selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", "myArea")
        .style("fill", function(d) { return streamColor(d.key); })
        .attr("d", area)        
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    //graph title
    g1.append("text")
    .attr("x", (streamWidth) / 2 )
    .attr("y", -15)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .text("Average Salary per Job Stream Chart");

    //plot 2: Scatter Plot for overview
    // Select jobs on the plot by brushing to change the jobs displayed in the stream graph and bar chart
    const g2 = svg.append("g")
                .attr("transform", `translate(${scatterMargin.left + scatterLeft}, ${scatterTop + scatterMargin.top})`);
               
    // X label
    g2.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .text("Year");
    // Y label
    g2.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("fill", "black")
    .text("Average Salary");

    // X ticks
    const x2 = d3.scaleBand()
    .domain([2020, 2021, 2022, 2023])
    .range([0, scatterWidth])
    .padding(0.1);
    const xAxisCall = d3.axisBottom(x2)
                        .ticks(4);
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
    .domain([0, d3.max(flattenedScatterData, d => d.salary_in_usd)+5000])
    .range([scatterHeight, 0]);

    const yAxisCall = d3.axisLeft(y2)
                        .ticks(12)
                        .tickFormat(d3.format(".2~s")); 
    g2.append("g").call(yAxisCall);

    //Below borrowed from https://d3-graph-gallery.com/graph/custom_theme.html and modified
    var scatterColor = d3.scaleOrdinal()
        .domain([2020,2021,2022,2023])
        .range(["#e02d2d","#ffd438","#0bbd46","#1d6af0"])

    // circles    
    //Borrowed from https://d3-graph-gallery.com/graph/violin_jitter.html and modified
    var jitterWidth = 80
    const circles = g2.selectAll("circle").data(flattenedScatterData);

    //scatter plot with jitter 
    circles.enter().append("circle")
         .attr("cx", function(d){d.jitterPOS = x2(d.work_year) + x2.bandwidth() / 2 - 50+ Math.random()*jitterWidth; return d.jitterPOS;})
         .attr("cy", d => y2(d.salary_in_usd))
         .attr("r", 3)
         .style("fill",function (d) { return scatterColor(d.work_year) })

    //Below code borrowed from https://d3-graph-gallery.com/graph/interactivity_brush.html and modified

    // Add brushing
    g2.call( d3.brush() 
        .extent( [ [0,0], [scatterWidth,scatterHeight] ] ) 
        .on("start brush", updateChart) 
        )


    // Function that is triggered when brushing is performed
    function updateChart(event) {
        extent = event.selection
        if (!extent) {
            return
        }else{
            circles.classed("selected", function(d){ return isBrushed(extent, d.jitterPOS, y2(d.salary_in_usd) ) } )
            selectedArray = flattenedScatterData.filter(d => isBrushed(extent,d.jitterPOS, y2(d.salary_in_usd) ));

            //update keys and other charts when brushed
            var forkeySet = new Set()
            for(i=0; i<selectedArray.length;i++){
                forkeySet = new Set(selectedArray.map(d => d.job_title));
            }
            if(forkeySet.size > 0){
                keys = Array.from(forkeySet);
                updateStreamGraph(keys,preStackedData);
                updateBarChart(keys);
            }
        }
    }

    function updateStreamGraph(keys,preStackedData){
        //reset canvas
        g1.selectAll(".myArea").remove();
        
        var stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys)
        (preStackedData)
        y.domain(d3.extent(stackedData.flat(), d => d[1]));
        
        var area = d3.area()
            .x(function(d) { return x(d.data.work_year); })
            .y0(function(d) { return y(d[0]); })
            .y1(function(d) { return y(d[1]); })        
            .curve(d3.curveBasis);

        //draw new area with animation
        g1.selectAll(".myArea")
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", "myArea")
            .style("fill", function(d) { return streamColor(d.key); })
            .attr("d", area)
            .style("opacity", 0)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)  
            .transition().duration(500)
            .style("opacity",1);
    }

    //Update the bar chart
    function updateBarChart(keys){
        //reset bar and axis
        g3.selectAll("rect").remove();
        g3.selectAll(".y-axis").remove();

        var barFiltered = rawData.filter(d => keys.includes(d.job_title));
        const rolledUp3 = d3.flatRollup(
            barFiltered,
            v => d3.mean(v, d => d.salary_in_usd),
            d => d.company_size
        ).map(([company_size,salary_in_usd])=>({company_size,salary_in_usd}));
        
        const y3 = d3.scaleLinear()
        .domain([0, d3.max(rolledUp3, d => d.salary_in_usd)])
        .range([barHeight, 0])
        .nice();
        const yAxisCall3 = d3.axisLeft(y3)
                            .ticks(10)                       
                            .tickFormat(d3.format(".2~s")); 
        g3.append("g").call(yAxisCall3)
            .attr("class", "y-axis");

        g3.selectAll(".mybars")
        .data(rolledUp3)
        .enter()
        .append("rect")
            .attr("x", d => x3(d.company_size))
            .attr("y", d => y3(d.salary_in_usd))
            .attr("width", x3.bandwidth())
            .attr("height", d => barHeight -y3(d.salary_in_usd))
            .attr("fill", "steelblue");
    }

    // A function that return TRUE or FALSE according if a dot is in the selection or not
    function isBrushed(brush_coords, cx, cy) {
        var x_0 = brush_coords[0][0],
            x_1 = brush_coords[1][0],
            y_0 = brush_coords[0][1],
            y_1 = brush_coords[1][1];
        return x_0 <= cx && cx <= x_1 && y_0 <= cy && cy <= y_1;    // This return TRUE or FALSE depending on if the points is in the selected area
    }

    //graph title
    g2.append("text")
    .attr("x", (scatterWidth) / 2 )
    .attr("y", -15)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .text("Average Salary Per Job Overview");
    
    // Bar Chart 
    const g3 = svg.append("g")
                .attr("transform", `translate(${barMargin.left + barLeft}, ${barTop + barMargin.top})`);

    group = ["S","M","L"]

    var barFiltered = rawData.filter(d => keys.includes(d.job_title));
    const rolledUp3 = d3.flatRollup(
        barFiltered,
        v => d3.mean(v, d => d.salary_in_usd),
        d => d.company_size
    ).map(([company_size,salary_in_usd])=>({company_size,salary_in_usd}));

    // X label
    g3.append("text")
    .attr("x", barWidth / 2)
    .attr("y", barHeight + 50)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Company Size");

    // Y label
    g3.append("text")
    .attr("x", -(barHeight / 2))
    .attr("y", -40)
    .attr("font-size", "14px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Salary in USD");

    // X ticks
    const x3 = d3.scaleBand()
    .domain(group)
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
    .domain([0, d3.max(rolledUp3, d => d.salary_in_usd)])
    .range([barHeight, 0])
    .nice();
    const yAxisCall3 = d3.axisLeft(y3)
                        .ticks(12)                       
                        .tickFormat(d3.format(".2~s")); 
    g3.append("g").call(yAxisCall3)
                  .attr("class", "y-axis");

    //Below code borrowed from https://d3-graph-gallery.com/graph/barplot_basic.html and modified
    g3.selectAll("mybars")
        .data(rolledUp3)
        .enter()
        .append("rect")
            .attr("x", d => x3(d.company_size))
            .attr("y", d => y3(d.salary_in_usd))
            .attr("width", x3.bandwidth())
            .attr("height", d => barHeight -y3(d.salary_in_usd))
            .attr("fill", "steelblue");
         
    g3.append("text")
    .attr("x", (barWidth) / 2 )
    .attr("y", -10)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Average Job Salary by Company Size");

    }).catch(function(error){
    console.log(error);
});