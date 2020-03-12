/* global cy:true */

const IMAGE_URL = 'https://lh3.googleusercontent.com/8zYxviiazPFUXLQvhEvq906503rRmYIoWhpjtVSPYTgIGxN1DvHEs7nPNY87pRWkps3VXU3XqusrnLXI9U-0GDGDHWpauUpylc4mtaOt';

describe('story visual editor', function () {
    afterEach(function () {
        cy.deleteProject('bf');
    });

    beforeEach(function () {
        cy.createProject('bf', 'My Project', 'en').then(
            () => cy.createNLUModelProgramatically('bf', '', 'de'),
        );
        cy.login();
        cy.createStoryGroup();
        cy.createStoryInGroup();
    });

    it('should persist a user utterance, a bot response, and display add-user-line option appropriately', function() {
        cy.importNluData('bf', 'nlu_sample_en.json', 'en');
        cy.train();
        cy.visit('/project/bf/stories');
        cy.browseToStory('Groupo (1)');

        cy.dataCy('add-user-line').click({ force: true });
        cy.dataCy('user-line-from-input').click({ force: true });
        cy.dataCy('utterance-input')
            .find('input')
            .type('Hello{enter}');
        cy.dataCy('intent-label').contains('chitchat.greet')
            .click({ force: true });
        cy.get('.intent-dropdown input')
            .click({ force: true })
            .type('myTestIntent{enter}');
        cy.dataCy('save-new-user-input').click({ force: true });

        cy.contains('Hello'); // checks that text has been saved

        cy.dataCy('add-user-line').should('not.exist'); // cannot have adjacent user utterances

        cy.dataCy('add-bot-line').click({ force: true });

        cy.contains('Hello'); // checks that text has been saved

        cy.dataCy('from-text-template').click({ force: true });
        cy.dataCy('bot-response-input')
            .find('textarea').should('be.empty');

        cy.dataCy('bot-response-input')
            .find('textarea')
            .clear()
            .type('I do too.');

        cy.get('[agent=bot]').should('have.length', 1); // ensure that enter do not create a new response

        cy.dataCy('add-user-line').should('exist'); // would not lead to adjacent user utterances

        cy.dataCy('add-bot-line').click({ force: true });
        cy.contains('I do too.'); // checks that text has been saved
        cy.dataCy('from-qr-template').click({ force: true });
        cy.dataCy('bot-response-input').should('have.length', 2);
        cy.dataCy('bot-response-input')
            .eq(1)
            .find('textarea')
            .clear()
            .type('I do too qr');

        cy.dataCy('button_title').click({ force: true });
        cy.dataCy('button_title').click({ force: true });

        cy.dataCy('enter-button-title')
            .find('input')
            .clear()
            .type('postback option');
        cy.dataCy('intent-label').contains('intent')
            .click({ force: true });
        cy.get('.intent-dropdown input')
            .type('get_started{enter}');
        cy.dataCy('save-button').click({ force: true });

        cy.dataCy('add-quick-reply').click({ force: true });

        cy.dataCy('button_title').click({ force: true });

        cy.dataCy('enter-button-title')
            .find('input')
            .clear()
            .type('web_url option');
        cy.dataCy('select-button-type')
            .find('[role=option]').eq(1)
            .click({ force: true });
        cy.dataCy('enter_url')
            .find('input')
            .clear()
            .type('https://myurl.com/');
        cy.dataCy('save-button').click({ force: true });

        cy.dataCy('toggle-md').click({ force: true });
        cy.dataCy('story-editor')
            .find('.ace_line').eq(0)
            .should('have.text', '* myTestIntent');
        cy.dataCy('story-editor').find('.ace_line')
            .eq(2).invoke('text')
            .as('response');

        cy.visit('/project/bf/dialogue/templates/');
        cy.get('@response').then((response) => {
            cy.log(response);
            cy.get('[role=row]')
                .contains('[role=row]', response.replace('-', '').trim())
                .should('exist') // there's a row with our text and response hash
                .find('.icon.edit')
                .click();
        });
        cy.dataCy('postback_option').contains('postback option').should('exist');
        cy.dataCy('web_url_option').contains('web_url option').should('exist');

        cy.visit('/project/bf/nlu/models');
        cy.get('[role=row]')
            .contains('[role=row]', 'Hello')
            .contains('myTestIntent')
            .should('exist'); // there nlu example is there too
    });

    it('should be able to add an image bot response', function () {
        cy.dataCy('add-bot-line').click({ force: true });
        cy.dataCy('from-image-template').click({ force: true });
        cy.dataCy('image-url-input')
            .find('input')
            .type(`${IMAGE_URL}{enter}`);
        cy.get('img.small.image')
            .should('have.attr', 'src', IMAGE_URL);
    });

    it('should rerender on language change', function () {
        cy.importNluData('bf', 'nlu_sample_en.json', 'en');

        cy.browseToStory('Get started');
        cy.dataCy('bot-response-input')
            .find('textarea')
            .type('I agree let\'s do it!!')
            .blur();

        cy.dataCy('language-selector').click().find('div').contains('German')
            .click({ force: true });
        cy.dataCy('single-story-editor').should('not.contain', 'Let\'s get started!');
        cy.dataCy('single-story-editor').should('not.contain', 'I agree let\'s do it!!');

        cy.dataCy('language-selector').click().find('div').contains('English')
            .click({ force: true });
        cy.dataCy('single-story-editor').should('contain', 'Let\'s get started!');
        cy.dataCy('single-story-editor').should('contain', 'I agree let\'s do it!!');

        cy.dataCy('language-selector').click().find('div').contains('German')
            .click({ force: true });
        cy.dataCy('single-story-editor').should('not.contain', 'Let\'s get started!');
        cy.dataCy('single-story-editor').should('not.contain', 'I agree let\'s do it!!');

        cy.dataCy('language-selector').click().find('div').contains('English')
            .click({ force: true });
        cy.dataCy('single-story-editor').should('contain', 'Let\'s get started!');
        cy.dataCy('single-story-editor').should('contain', 'I agree let\'s do it!!');
    });

    it('should use the canonical example if one is available', function () {
        cy.MeteorCall('nlu.insertExamplesWithLanguage', ['bf', 'en', [
            {
                text: 'bonjour canonical',
                intent: 'chitchat.greet',
                canonical: true,
            },
        ]]);
        cy.MeteorCall('nlu.insertExamplesWithLanguage', ['bf', 'en', [
            {
                text: 'bonjour not canonical',
                intent: 'chitchat.greet',
                canonical: false,

            },
        ]]);
        cy.visit('/project/bf/stories');
        cy.browseToStory('Greetings');
        cy.get('[role = "application"]').should('have.text', 'bonjour canonical');
    });

    it('should use the most recent example if no canonical is available', function () {
        cy.MeteorCall('nlu.insertExamplesWithLanguage', ['bf', 'en', [
            {
                text: 'bonjour not canonical',
                intent: 'chitchat.greet',
            },
        ]]);
        cy.visit('/project/bf/nlu/models');
        cy.get('.black.gem').click({ force: true });
        cy.get('.black.gem').should('not.exist');
        cy.MeteorCall('nlu.insertExamplesWithLanguage', ['bf', 'en', [
            {
                text: 'bonjour not canonical recent',
                intent: 'chitchat.greet',
            },
        ]]);
        cy.visit('/project/bf/stories');
        cy.browseToStory('Greetings');
        cy.get('[role = "application"]').should('have.text', 'bonjour not canonical recent');
    });
});
