var _dollarToInr = 50;
var TM = function(init){
	var team = init || {};
	var total_salary = 0;

	function countTeam () {
		function total_count(dept){
			var total = 0;
			for (var i in dept) {
				total += dept[i].count;
			}
			return total;
		}
		var total = 0;
		for (var i in team) {
			total += total_count(team[i]);
		}
		return total;
	}
	function addUnit (dept, desig, count, salary) {
		team[dept] || (team[dept] = {});
		team[dept][desig] || (team[dept][desig] = {count: 0, salary: 0});
		team[dept][desig].count += count;
		if (salary) team[dept][desig].salary = salary;
	}
	function salary(){
		function dept_salary(dept){
			var t = 0;
			for (var i in dept) {
				t += dept[i].count * dept[i].salary;
			}
			return t;
		}
		var total = 0;
		for (var i in team) {
			total += dept_salary(team[i]);
		}
		total_salary += total;
		return total;
	}
	function get_total() {
		return total_salary;
	}
	return {
		addUnit: addUnit,
		salary: salary,
		total_salary: get_total
	};
};

var MM = function(init){
	var value = init || 0;
	function constant(rate, steps) {
		this.value = this.value + rate*steps;
	}
	function linear(rate, steps){
		this.value = (this.value + this.value*rate*steps);
	}
	function compound(rate, steps){
		this.value = (this.value*Math.pow(1+rate, steps));
	}
	return {
		value: value,
		constant: constant,
		linear: linear,
		compound: compound
	};
};

function VariableCost (users, viewer_pc) {
	// users: no. of users
	// viewerpc: percentage of users who view videos
	// viewsperuser: no. of videos each user watches
	var total = 0;

	function bandwidth(bitrate, duration){
		// bitrate in Mbps
		// duration in s
		return bitrate*duration/8/1024;
	}
	function cost_application_server(users) {
		var rate = 0.03*_dollarToInr;//rupees per hour
		return rate*750*Math.ceil(users/5000);
	}
	function cost_cloudfront(usage) {
		// usage in GB
		var rate = 0.17*_dollarToInr;
		return rate*usage;
	}

	function cost_s3(usage) {
		// usage in GB
		var rate = 0.03*_dollarToInr;
		return rate*usage;
	}

	function cost() {
		var c = (cost_application_server(users.value)
			+ cost_s3(users.value*1)
			+ cost_cloudfront(users.value*viewer_pc.value*bandwidth(1, 30*60)));
		total += c;
		return c;
	}
	return {
		cost: cost,
		total: function() { return total; }
	};
}
function MiscellaneousCost (team, user) {
	var internet = 5000;
	var phone = 10000;
	var rent = 50000;
	var electricity = 10000;
	var travel = 30000;
	var total = 0;
	function get_cost() {
		var t = internet + phone + rent + electricity;
		total += t;
		return t;
	}
	return {
		cost: get_cost,
		total: function() { return total; }
	};
}
function RevenueStream (users, usershare, rpu) {
	var total = 0;
	function getRevenue(){
		var r = users.value*usershare.value*rpu.value;
		total += r;
		return r;
	}
	function print () {
		console.log('Revenue Stream: ', users.value, usershare.value, rpu.value, total);
	}
	function getTotalRevenue() {
		return total;
	}
	return {
		revenue: getRevenue,
		getTotalRevenue: getTotalRevenue,
		print: print
	};
}
function Estimator(){
	var month = 0;
	var team = TM(); // team manager
	var users = MM(0); // metric for users
	var params = {};
	var cost = {};
	var revenue = {};
	var monthly = [];

	function setParam(name, val) { params[name] = val; }
	function getParam(name) { return params[name]; }
	function addRevenue(name, stream){ revenue[name] = stream; }
	function addCost(name, stream){ cost[name] = stream; }
	function nextInteration() {
		month ++;
		var m = {
			month: month,
			users: Math.round(users.value),
			cost: 0,
			revenue: 0,
			costs: {},
			revenues: {}
		};
		if (month > 1) {
			m.users -= monthly[month - 2].users;
		}
		for (var i in revenue) {
			var r = Math.round(revenue[i].revenue());
			m.revenue += r;
			m.revenues[i] = r;
		}
		for (var i in cost) {
			var c = Math.round(cost[i].cost());
			m.cost += c;
			m.costs[i] = c;
		}
		monthly.push(m);
		return m;
	}
	function getUsers(){
		return users;
	}
	function getTeam(){
		return team;
	}
	function getMonthly(){
		return monthly;
	}
	function getAggregate(){
		var agg = {
			total_cost: 0,
			total_revenue: 0,
			total_income: 0
		};
		for (var i in revenue) {
			agg['r_' + i] = revenue[i].getTotalRevenue();
			agg.total_revenue += agg['r_' + i];
		}
		for (var i in cost) {
			agg['c_' + i] = cost[i].total();
			agg.total_cost += agg['c_' + i];
		}
		agg.total_income = agg.total_revenue - agg.total_cost;
		return agg;
	}
	return {
		users: getUsers,
		team: getTeam,
		set: setParam,
		get: getParam,
		addRevenue: addRevenue,
		addCost: addCost,
		next: nextInteration,
		monthly: getMonthly,
		aggregate: getAggregate
	};
}

module.exports = {
	TeamManager: TM,
	MetricManager: MM,
	VariableCost: VariableCost,
	RevenueStream: RevenueStream,
	MiscellaneousCost: MiscellaneousCost,
	Estimator: Estimator
};

