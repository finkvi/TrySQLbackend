#!/bin/bash

echo "Run deploy script in ${PWD}";

#Load env
if [ -f .env ]; then
    echo "Load enviroments from ${PWD}/.env";
    export $(grep -v '^#' .env | xargs);
fi

echo "Deploy user is ${DEPLOY_USER}";
export CURRENT_UID=$(id -u):$(id -g);
echo "Curren user is ${CURRENT_UID}";
echo "Deploy PATH is ${DEPLOY_PATH}";

export STRAPI_CMD="strapi develop";
if [ "$NODE_ENV" = production ] ; then
    export STRAPI_CMD="strapi start";
fi
echo "Strapi will start with command ${STRAPI_CMD}";

if [ "$HOT_DEPLOY" = false ] ; 
    then
        docker volume inspect $DATABASE_CONTAINER_VOLUME > /dev/null 2>&1;
        if [ "$?" != "0" ]
        then
            echo "The source volume \"$DATABASE_CONTAINER_VOLUME\" does not exist. Create volume for Database";
            docker volume create $DATABASE_CONTAINER_VOLUME;
        else
            echo 'Create Database backup. Just DB copy volume';
            date=`date '+%Y%m%d%H%M%S'`;
            ./sh_utils/clone_volume.sh $DATABASE_CONTAINER_VOLUME ${DATABASE_CONTAINER_VOLUME}_backup_${date} > /dev/null;
        fi

        echo 'Installing node_modules and build';
        docker run --rm -v $PWD:/srv/app strapi/base /bin/bash -c "cd /srv/app ; yarn install ; yarn build ; chown -R ${CURRENT_UID} /srv/app";

        echo 'Down all containers';
        PREV_COMPOSE_PATH=$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project.working_dir"}}' strapi);
        echo 'Previous path is ${PREV_COMPOSE_PATH}';
        docker-compose -f $PREV_COMPOSE_PATH/docker-compose.yml down;
    else
        echo 'Just stop strapi container';
        docker stop strapi;
        export DEPLOY_LATEST=$(readlink -f $DEPLOY_PATH/latest);
        echo 'Just move node_modules from latest...';
        mv $DEPLOY_LATEST/node_modules node_modules;
        echo 'Just move build from latest...';
        mv $DEPLOY_LATEST/build build;
fi

echo 'Recreate link to latest directory';
rm $DEPLOY_PATH/latest;
ln -s $PWD $DEPLOY_PATH/latest;

if [ "$HOT_DEPLOY" = false ] ; 
    then
        echo "Start Docker Compose with Strapi and Database";
        docker-compose -f docker-compose.yml up -d;
    else
        echo 'Start strapi container';
        docker start strapi;
fi