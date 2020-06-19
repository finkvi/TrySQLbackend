function createLead (lead) {
    return strapi.query('lead').create(lead)
            .then((lead) => {
                return lead.id;
            })
} 

function createAnswers (answers, leadid) {

    const promiseAnswers = answers.map(a => {
        const answer = {
            ...a,
            lead: leadid
        };

        return strapi.query('answer').create(answer);
    });

    return Promise.all(promiseAnswers);
}

module.exports = {  
    // GET /variant if tasks is null, generate random
    sendanswers: ctx => {
        const lead = ctx.request.body.lead;
        const answers = ctx.request.body.answers;

        return createLead(lead)
                .then((leadid) => createAnswers(answers, leadid))
                .then((answers) => {
                    return {
                        statusCode: "200",
                        message: "Your answers were saved. We'll call you. Thx"
                    };
                })
    }  
  };