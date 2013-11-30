var ParticipatesIn = require('../model/ParticipatesIn');
var Team = require('../model/Team');
var Event = require('../model/Event');
var permissions = require('../helper/permissions');

exports.scoreCodes = function(req, res) {
	ParticipatesIn.getScoreCodes(function(err, result) {
		if(err) {
			res.send(500, err);
		} else {
			res.json(result);
		}
	});
};

exports.tiers = function(req, res) {
	ParticipatesIn.getTiers(function(err, result) {
		if(err) {
			res.send(500, err);
		} else {
			res.json(result);
		}
	});
};

exports.participators = function(req, res) {
	permissions.tournament(req, res, req.params.tournamentID, function() {
		ParticipatesIn.getParticipatingTeamsByEventAndTournament(req.params.tournamentID, req.params.eventName, req.params.division, function(err, entries) {
			if(err) {
				res.send(500, err);
			} else {
				var participators = [];
				
				entries.forEach(function(entry) {
					participators.push(entry.toParticipatorJson());
				});

				res.json({
					participators: participators,
					event: entries[0].event.toJson()
				});
			}
		});
	});
};

exports.update = function(req, res) {
	permissions.tournament(req, res, req.body.participants[0].team.tournamentID, function() {
		var participants = [];
		var succeeded = true;
		var returnCount = 0;
		req.body.participants.forEach(function(entry) {
			var participant = new ParticipatesIn({
				team: new Team(entry.team),
				event: new Event(req.body.event),
				scoreCode: entry.scoreCode,
				score: entry.score,
				tiebreak: entry.tiebreak,
				tier: entry.tier
			});
			participant.save(function(err) {
				if(err) {
					succeeded = false;
					res.send(500, err);
				} else if(succeeded && (++returnCount === req.body.participants.length)) {
					res.send(200);
				}
			});
		});
	});
};