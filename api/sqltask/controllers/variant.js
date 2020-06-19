function getRandomIdsBySQL () {
    return new Promise((resolve, reject) => {
            
        const knex = strapi.connections.default;

        knex.raw(`with CT AS (
                    select C.id as category_id, T.id as task_id, C.score as score
                        from sqlcategories C, sqltasks T 
                        where C.id = T.sqlcategory
                        order by RANDOM()) 
                select distinct on (category_id, score) task_id from CT
                order by score
        `)
        .then(result => {
            resolve(result.rows.map(t => t.task_id));
        })
        .catch((error) => {
            reject(new Error(error));
        })
    })
}

function getVariantByIds(ids) {
    return new Promise((resolve, reject) => {
        resolve(
            strapi.query('sqltask').find({ id_in: ids }, ['sqlcategory'])
        );
    });    
}

module.exports = {  
    // GET /variant if tasks is null, generate random
    variant: ctx => {
        const tasks = ctx.request.body.localTasks;

        if (tasks) {
            let ids = tasks.split(',').map(Number);
            return getVariantByIds(ids);
        } else {
            return getRandomIdsBySQL()
                .then(ids => {
                    return getVariantByIds(ids);
                })
        }
    }  
  };
/*
  function getVariantBySQL () {
    return new Promise((resolve, reject) => {
            
        const knex = strapi.connections.default;

        knex.raw(`with CT AS (
                    select C.id as category_id, C.*, T.id as task_id, T.* 
                        from sqlcategories C, sqltasks T 
                        where C.id = T.sqlcategory
                        order by score, RANDOM()) 
                select distinct on (category_id) * from CT
        `)
        .then(result => {
            resolve(result.rows);
        })
        .catch((error) => {
            reject(console.error(error));
        })
    })
}
*/

/* 
            //const Sqlcategory = strapi.query('sqlcategory').model;
            const Sqlcategory = strapi.models.sqlcategory;
            const Sqltask = strapi.query('sqltask').model;

            Sqlcategory.query(qb => {
                qb
                .with('CT', (qb_with) => {
                    qb_with
                        .select('C.id as c_id, C.name, C.score, T.id as t_id, T.task')
                        .from({C: 'sqlcategories', T: 'sqltasks'})
                        .whereRaw('"C".id = "T".sqlcategory')
                        .orderByRaw('RANDOM()')
                })
                .select('distinct on (c_id) * from CT')
                //.select('C.id')
                //.whereRaw('"C".id IN (?, ?)', [2, 3])
                //.from ({C: 'sqlcategories', T: 'sqltasks'})
                
                //console.log(qb);
                
                return qb;
            })
            .fetchAll({debug: true, withRelated:[]})
            .then(result => {
                resolve(result.toJSON());
            })
            .catch((error) => {
                reject(console.error(error));
            }) */