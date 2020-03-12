import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { StoryGroups } from './storyGroups.collection';
import { Projects } from '../project/project.collection';
import { Stories } from '../story/stories.collection';
import { deleteResponsesRemovedFromStories } from '../graphql/botResponses/mongo/botResponses';

export const createIntroStoryGroup = (projectId) => {
    if (!Meteor.isServer) throw Meteor.Error(401, 'Not Authorized');
    Meteor.call(
        'storyGroups.insert',
        {
            name: 'Intro stories',
            projectId,
        },
        (err, storyGroupId) => {
            if (!err) {
                Meteor.call('stories.insert', {
                    story: '* get_started\n    - utter_get_started',
                    name: 'Get started',
                    storyGroupId,
                    projectId,
                    events: ['utter_get_started'],
                });
            } else {
                // eslint-disable-next-line no-console
                console.log(err);
            }
        },
    );
};

export const createDefaultStoryGroup = (projectId) => {
    if (!Meteor.isServer) throw Meteor.Error(401, 'Not Authorized');
    Meteor.call(
        'storyGroups.insert',
        {
            name: 'Default stories',
            projectId,
        },
        (err, storyGroupId) => {
            if (!err) {
                Meteor.call('stories.insert', {
                    story: '* chitchat.greet\n    - utter_hi',
                    name: 'Greetings',
                    storyGroupId,
                    projectId,
                    events: ['utter_hi'],
                });
                Meteor.call('stories.insert', {
                    story: '* chitchat.bye\n    - utter_bye',
                    name: 'Farewells',
                    storyGroupId,
                    projectId,
                    events: ['utter_bye'],
                });
            } else {
                // eslint-disable-next-line no-console
                console.log(err);
            }
        },
    );
};

function handleError(e) {
    if (e.code === 11000) {
        throw new Meteor.Error(400, 'Group name already exists');
    }
    throw new Meteor.Error(500, 'Server Error');
}

Meteor.methods({
    async 'storyGroups.delete'(storyGroup) {
        check(storyGroup, Object);
        const eventstoRemove = Stories.find({ storyGroupId: storyGroup._id }, { fields: { events: true } })
            .fetch()
            .reduce((acc, { events = [] }) => [...acc, ...events], []);
        Projects.update(
            { _id: storyGroup.projectId },
            { $pull: { storyGroups: storyGroup._id } },
        );
        StoryGroups.remove({ _id: storyGroup._id });
        const result = Stories.remove({ storyGroupId: storyGroup._id });
        deleteResponsesRemovedFromStories(eventstoRemove, storyGroup.projectId);
        return result;
    },

    'storyGroups.insert'(storyGroup) {
        check(storyGroup, Object);
        const { projectId } = storyGroup;
        try {
            const id = StoryGroups.insert({
                ...storyGroup, storyGroupId: projectId, children: [],
            });
            Projects.update(
                { _id: projectId },
                { $push: { storyGroups: { $each: [id], $position: 0 } } },
            );
            return id;
        } catch (e) {
            return handleError(e);
        }
    },

    'storyGroups.update'(storyGroup) {
        check(storyGroup, Object);
        try {
            const { _id, ...rest } = storyGroup;
            return StoryGroups.update(
                { _id }, { $set: rest },
            );
        } catch (e) {
            return handleError(e);
        }
    },
});
