module.exports = {
    // GET /variant
    all: async ctx => {
        const models = strapi.models;
        //console.log(models);

        const sampleModels = await strapi.models['sample-data-tables']
            .query( qb => {
                qb.select(['table', 'desc'])
            })
            .fetchAll()
            .then( res => {
                return res.toJSON();
            });
        
        const promiseDataSelection = sampleModels.map((value, key) => {
            return new Promise((resolve, reject) => {
                if (!strapi.models[value.table]) 
                    reject(new Error ('There is no models for ' 
                        + value.table + ". See records in sample-data-tables"));

                //Create Structure
                let create = 'CREATE TABLE IF NOT EXISTS ' + value.table.toUpperCase()
                + '(id integer PRIMARY KEY, '

                let modelAttr = strapi.models[value.table].attributes;
                let attr = Object.keys(modelAttr).map((key, index) => {
                    let type = modelAttr[key].type;
                    let sqlType = 'string';
                    
                    if (!type) sqlType = 'integer'
                    else if (['date', 'boolean', 'datetime', 'float'].indexOf(type) !== -1) sqlType = type;

                    return key + ' ' 
                        + (sqlType)
                        + (modelAttr[key].required ? ' not null' : '') 
                        + (modelAttr[key].unique ? ' unique' : '');
                });

                create += attr.join(', ') + ')';

                //Get Sample Data
                strapi.models[value.table]
                    .query( qb => {
                        qb.select(['id', ...Object.keys(modelAttr)])
                    })
                    .fetchAll({debug: false, withRelated:[]})
                    .then(res => {

                         const response = { 
                            table: value.table.toUpperCase(),
                            desc: value.desc,
                            SQL: create,
                            SampleData: res.toJSON()
                        };

                        resolve (response);
                    });
                });
        });

        const sampleDB = await Promise.all(promiseDataSelection);

        return sampleDB;
    },
  };