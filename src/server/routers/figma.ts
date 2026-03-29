import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { FigmaMCPService } from '../services/figma-mcp';

const figmaMCP = new FigmaMCPService();

export const figmaRouter = router({
  fetchDesign: publicProcedure
    .input(
      z.object({
        figmaUrl: z.string().url(),
      })
    )
    .query(async ({ input }) => {
      const design = await figmaMCP.fetchDesign(input.figmaUrl);
      return design;
    }),

  generateCode: publicProcedure
    .input(
      z.object({
        figmaUrl: z.string().url(),
        componentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const design = await figmaMCP.fetchDesign(input.figmaUrl);
      const component = design.components.find((c) => c.id === input.componentId);

      if (!component) {
        throw new Error('Component not found');
      }

      const code = await figmaMCP.generateReactCode(component);
      const tailwindConfig = await figmaMCP.generateTailwindConfig(design.designTokens);

      return {
        component: component.name,
        code,
        tailwindConfig,
        designTokens: design.designTokens,
      };
    }),

  generateAllComponents: publicProcedure
    .input(
      z.object({
        figmaUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const design = await figmaMCP.fetchDesign(input.figmaUrl);

      const generatedComponents = await Promise.all(
        design.components.map(async (component) => {
          const code = await figmaMCP.generateReactCode(component);
          return {
            id: component.id,
            name: component.name,
            code,
          };
        })
      );

      const tailwindConfig = await figmaMCP.generateTailwindConfig(design.designTokens);

      return {
        designName: design.name,
        components: generatedComponents,
        tailwindConfig,
        designTokens: design.designTokens,
      };
    }),
});
