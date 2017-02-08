$(document).ready(function() {

	// URL FOR READING IN THE DATA
	var url = "javascripts/global-temperature.json";
	
	// HELPER VARIABLES
	var formatYear = d3.format("d");
	var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var colors = ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"];

	// GET THE GDP JSON DATA, THEN BUILD THE BAR CHART TO VISUALIZE IT
	d3.json(url, function(error, jsonData) {
		
		// IF THERE WAS AN ERROR, STOP NOW AND SHOW AN ERROR MESSAGE
		if (error) { 
			$(".errorMessage").show();
			return error;
		}
		
		// CHECK WHAT DATA WE HAVE
		console.log(jsonData);
		var baseTemperature = jsonData.baseTemperature;
		var data = jsonData.monthlyVariance;
		console.log(data);

		// SET SOME STYLING VARIABLES FOR THE CHART
		var margin = {
			top: 5,
			right: 20,
			bottom: 50,
			left: 75
		};
		var width = 1000 - margin.left - margin.right;
		var height = 500 - margin.top - margin.bottom;
		var barWidth = Math.ceil(width / data.length);

		// X SCALE
		// TAKE THE MIN AND THE MAX FINISH TIMES AND FIT IT TO THE WIDTH WE SET EARLIER
		// ALSO ADD A FEW SECONDS OF PADDING ON EITHER SIDE TO GIVE US SOME ROOM
		// REVERSE THE RANGE SO THAT THE SMALLER VALUES ARE ON THE RIGHT
		var x = d3.scale.linear()
			.domain([1750, 2020])
			.range([0, width]);

		// Y SCALE
		// SET THE DOMAIN TO GO FROM 1 TO 36 SINCE WE HAVE 35 DATA POINTS AND WANT A LITTLE EXTRA SPACE AT THE BOTTOM
		// AND FIT IT TO OUR HEIGHT WE SET EARLIER
		// BUT IT'S FLIPPED BECAUSE WE GO FROM TOP-LEFT TO BOTTOM-RIGHT WITH SVG
		var y = d3.scale.linear()
			.domain([1,36])
			.range([0, height]);

		// X-AXIS
		// PUT THE X-AXIS ON THE BOTTOM AND FORMAT THE TICKS TO BE MINUTES AND SECONDS
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(40,"")
			.tickFormat(formatYear);

		// Y-AXIS
		// PUT THE Y-AXIS ON THE LEFT AND FORMAT THERE TO BE 7 TICKS FOR THE RANKINGS
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			// .ticks(7, "")
			.ticks(d3.time.months)
		    .tickSize(16, 0)
		    .tickFormat(d3.time.format("%B"));

		// TOOLTIP, CURRENTLY EMPTY AND HIDDEN
		var tooltip = d3.select(".mainContainer").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		// CREATE A SPACE FOR THE CHART TO BE FORMED
		var chart = d3.select(".chart")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// APPEND THE X-AXIS
		// HAVE IT START IN THE BOTTOM-LEFT CORNER
		chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("x", width/2)
			.attr("dx", "0em")
			.attr("dy", "2.8em")
			.attr("class", "xLabel")
			.style("text-anchor", "middle")
			.text("Year");


		// APPEND THE Y-AXIS
		// ALSO APPEND A LABEL FOR THE Y-AXIS, ROTATE IT 90 DEGREES, AND ANCHOR IT TO THE END
		chart.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
	        .attr("y", 0 - margin.left)
	        .attr("x", 0 - (height / 2))
	        .attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Month");

		// CREATE THE BARS THAT MAKE UP OUR BAR CHART
		// GO THROUGH EACH DATA POINT
		// CREATE A CIRCLE FOR IT
		// SET THE CX COORDINATE FOR IT USING THE TIME IN SECONDS
		// SET THE CY COORDINATE FOR IT USING THE RANKING
		// SET ALL THE RADII TO BE THE SAME SIZE
		// SET THE COLOR OF THE CIRCLE BASED ON IF THERE WAS A DOPING ALLEGATION OR NOT
		// FINALLY, SET THE MOUSEOVER/MOUSEOUT EFFECTS FOR THE TOOLTIP, CHANGING THE CONTENT BASED ON THE SELECTED DATA POINT
		chart.selectAll(".circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "circle")
			.attr("cx", function(d) {
				return x(d.Seconds);
			})
			.attr("cy", function(d) {
				return y(d.Place);
			})
			.attr("r", 5)
			.attr("fill", function(d) {
				if (d.Doping == "") {
					return "#35de1e";
				} else {
					return "#de1e1e";
				}
			})
			.on("mouseover", function(d) {
				var circleDataPoint = d3.select(this);
				circleDataPoint.attr("class", "mouseover");
				tooltip.transition()
					.duration(200)
					.style("opacity", 0.9);
				if (d.Doping == "") {
					d.Doping = "No doping allegations";
				}
				tooltip.html("<p><strong>" + d.Name + " (" + d.Nationality + ")</strong></p>" + 
					"<p>Year: " + d.Year + ", Time: " + d.Time + "</p>" +
					"<p>&nbsp;</p>" + 
					"<p>" + d.Doping + "</p>")
			})
			.on("mouseout", function() {
				var circleDataPoint = d3.select(this);
				circleDataPoint.attr("class", "mouseoff");
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		// BIKER NAME LABELS
		// ADD THESE NEXT TO EACH DATA POINT
		chart.selectAll(".bikerLabel")
			.data(data)
			.enter()
			.append("text")
			.attr("class", "bikerLabel")
			.text(function(d) {
				return d.Name;
			})
			.attr("x", function(d) {
				return x(d.Seconds);
			})
			.attr("y", function(d) {
				return y(d.Place);
			})
			.attr("dx", "10px")
			.attr("dy", "4px")
			.attr("text-anchor", "start")
			.on("mouseover", function(d) {
				tooltip.transition()
					.duration(200)
					.style("opacity", 0.9);
				if (d.Doping == "") {
					d.Doping = "No doping allegations";
				}
				tooltip.html("<p><strong>" + d.Name + " (" + d.Nationality + ")</strong></p>" + 
					"<p>Year: " + d.Year + ", Time: " + d.Time + "</p>" +
					"<p>&nbsp;</p>" + 
					"<p>" + d.Doping + "</p>")
			})
			.on("mouseout", function() {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

	});

});