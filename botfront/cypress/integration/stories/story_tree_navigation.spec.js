/* global cy:true */
const storyGroupOne = 'Default stories';

describe('story tree navigation', function() {
    afterEach(function() {
        cy.deleteProject('bf');
    });

    beforeEach(function() {
        cy.createProject('bf', 'My Project', 'fr').then(() => cy.login());
    });
    
    it('should be possible to delete a story group', function() {
        cy.visit('/project/bf/stories');
        cy.get('#storygroup-tree').should('contain.text', storyGroupOne);
        cy.deleteStoryOrGroup(storyGroupOne);
        cy.get('#storygroup-tree').should('not.contain.text', storyGroupOne);
    });

    it('it should not be possible to delete a story group with a linking origin or destination', function() {
        cy.createStoryGroup();
        cy.createStoryInGroup();
        cy.linkStory('Groupo (1)', 'Greetings');
        cy.deleteStoryOrGroup('Groupo', false); // origin group
        cy.get('.modal').should('contain.text', 'contains links');
        cy.escapeModal();
        cy.deleteStoryOrGroup('Groupo (1)', false); // origin story
        cy.get('.modal').should('contain.text', 'linked to another story');
        cy.escapeModal();
        cy.deleteStoryOrGroup(storyGroupOne, false); // destination group
        cy.get('.modal').should('contain.text', 'contains links');
        cy.escapeModal();
        cy.deleteStoryOrGroup('Greetings', false); // destination story
        cy.get('.modal').should('contain.text', 'linked to another story');
        cy.escapeModal();
    });

    it('after name edit, editing should display the right name', function() {
        cy.visit('/project/bf/stories');
        cy.get('#storygroup-tree').should('contain.text', storyGroupOne);
        cy.renameStoryOrGroup(storyGroupOne, 'HALLO');
        cy.get('#storygroup-tree').should('not.contain.text', storyGroupOne);
        cy.createStoryInGroup({ groupName: 'HALLO' });
        cy.dataCy('story-title').should('exist').should('have.value', 'HALLO (3)');
        cy.renameStoryOrGroup('HALLO (3)', 'BYE');
        cy.dataCy('story-title').should('exist').should('have.value', 'BYE');
    });

    it('train button should have the same text on both the NLU and stories page', function() {
        cy.visit('/project/bf/stories');
        cy.dataCy('story-group-menu-item', 'Intro stories').findCy('focus-story-group')
            .click({ force: true });
        cy.dataCy('train-button').trigger('mouseover');
        cy.contains('Train NLU and stories from 1 focused story group.');
        cy.dataCy('story-group-menu-item', 'Intro stories').findCy('focus-story-group')
            .click({ force: true });
        cy.dataCy('train-button').trigger('mouseover');
        cy.contains('Train NLU and stories from 1 focused story group.').should('not.exist');
    });
});
