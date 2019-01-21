/* eslint-env node */
import { createMacro, MacroError, References } from 'babel-plugin-macros';
import { NodePath } from '@babel/traverse';
import { ImportDeclaration } from '@babel/types';

function error(path: NodePath, message: string) {
  return path.buildCodeFrameError(message, MacroError);
}

function buildIfMacro({ references }: { references: References }) {
  if (references.default.length === 0) {
    return;
  }

  let removed: NodePath[] = [];

  references.default.forEach(referencePath => {
    let parentPath = referencePath.parentPath;
    if (!parentPath.isCallExpression()) {
      throw error(referencePath.parentPath, `build-if.macro can only be used as a function call.`);
    }

    let args = parentPath.get('arguments');

    if (args.length < 2 || args.length > 3) {
      throw error(referencePath.parentPath, `build-if.macro expects either two or three arguments.`)
    }

    let [predicatePath, consequent, alternate] = args;

    let predicate = predicatePath.evaluate();

    if (!predicate.confident) {
      throw error(predicatePath, `The first argument to build-if.macro must be statically analyzable.`);
    }

    if (typeof predicate.value !== 'boolean') {
      throw error(predicatePath, `The first argument to build-if.macro must have a boolean value, you passed ${predicate.value}`);
    }

    if (!consequent.isArrowFunctionExpression()) {
      throw error(consequent, `The second argument to build-if.macro must be an arrow function expression.`);
    }

    if (alternate && !alternate.isArrowFunctionExpression()) {
      throw error(alternate, `The third argument to build-if.macro must be an arrow function expression.`);
    }

    let [kept, dropped] = predicate.value ? [consequent, alternate] : [ alternate, consequent];
    if (kept) {
      referencePath.parentPath.replaceWith(kept.get('body'));
    } else {
      referencePath.parentPath.remove();
    }
    if (dropped) {
      removed.push(dropped);
    }
  });

  if (removed.length > 0) {
    let moduleScope = removed[0].findParent(path => path.type === 'Program').scope;
    Object.keys(moduleScope.bindings).forEach(name => {
      let binding = moduleScope.bindings[name];
      let bindingPath = binding.path;
      if (bindingPath.isImportSpecifier() || bindingPath.isImportDefaultSpecifier()) {
        if (binding.referencePaths.every(path => Boolean(path.findParent(p => removed.includes(p))))) {
          bindingPath.remove();
          let importPath = bindingPath.parentPath as NodePath<ImportDeclaration>;
          if (importPath.get('specifiers').length === 0) {
            importPath.remove();
          }
        }
      }
    });
  }
}

export default createMacro(buildIfMacro);
