/* global cy Cypress:true */
import { expect } from 'chai';

Cypress.Commands.add('newChatSesh', (lang) => {
    cy.get('body').then((body) => {
        const button = body.find('[data-cy=open-chat]:visible');
        if (button.length === 1) button.click(); // open chat if needed
    });
    cy.dataCy('open-chat').should('not.be.visible');
    cy.get('span.rw-loading').should('not.exist');
    cy.get('input.rw-new-message').should('not.be.disabled');
    cy.dataCy('restart-chat').click();
    cy.get('span.rw-loading').should('not.exist');
    if (lang) {
        cy.get('[data-cy=chat-language-option]').click();
        cy.get('[data-cy=chat-language-option] .visible.menu')
            .contains(lang)
            .click();
        cy.get('span.rw-loading').should('not.exist');
    }
});

Cypress.Commands.add('compareLastMessage', (expectedResponse) => {
    const response = typeof expectedResponse === 'string'
        ? expectedResponse
        : expectedResponse.response;
    const { replies } = expectedResponse;
    cy.wait(500);
    cy.get('.typing-indication').should('not.exist');
    if (response) {
        // this first contains makes it wait until the response actually appears
        cy.contains(response);
        cy.get('.rw-message').last().get('.rw-response').contains(response);
    }
    if (replies) {
        cy.get('.rw-message').last().get('.rw-replies').find('.rw-reply')
            .then($replies => expect(Array.from($replies).map(r => r.innerText)).to.deep.equal(replies));
    }
});

Cypress.Commands.add('testChatInput', (utterance, expectedResponse) => {
    cy.get('span.rw-loading').should('not.exist');
    cy.get('input.rw-new-message').should('not.be.disabled');
    cy.get('input.rw-new-message').click().type(`${utterance}{enter}`, { force: true });
    // Verify response
    cy.compareLastMessage(expectedResponse);
});

Cypress.Commands.add('testChatQR', (buttonText, expectedResponse) => {
    cy.get('span.rw-loading').should('not.exist');
    cy.get('input.rw-new-message').should('not.be.disabled');
    cy.get('.rw-message').last().get('.rw-replies')
        .find('.rw-reply')
        .contains(buttonText)
        .click();
    // Verify response
    cy.compareLastMessage(expectedResponse);
});
