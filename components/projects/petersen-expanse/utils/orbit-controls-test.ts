/**
 * OrbitControls Access Test Utility
 * This utility helps test different ways to access OrbitControls in TresJS
 */

export class OrbitControlsAccessTest {
  static testControlsAccess(controlsComponent: any): {
    method: string
    success: boolean
    controls: any
    target: any
  } {
    const tests = [
      {
        method: 'direct',
        accessor: () => controlsComponent,
        test: (controls: any) => controls && controls.target && typeof controls.target.set === 'function'
      },
      {
        method: 'value',
        accessor: () => controlsComponent.value,
        test: (controls: any) => controls && controls.target && typeof controls.target.set === 'function'
      },
      {
        method: '$el',
        accessor: () => controlsComponent.$el,
        test: (controls: any) => controls && controls.target && typeof controls.target.set === 'function'
      },
      {
        method: 'exposed',
        accessor: () => controlsComponent.exposed,
        test: (controls: any) => controls && controls.target && typeof controls.target.set === 'function'
      },
      {
        method: 'instance',
        accessor: () => controlsComponent.instance,
        test: (controls: any) => controls && controls.target && typeof controls.target.set === 'function'
      }
    ]

    for (const test of tests) {
      try {
        const controls = test.accessor()
        if (test.test(controls)) {
          return {
            method: test.method,
            success: true,
            controls,
            target: controls.target
          }
        }
      } catch (error) {
        // Continue to next test
      }
    }

    return {
      method: 'none',
      success: false,
      controls: null,
      target: null
    }
  }

  static logControlsStructure(controlsComponent: any): void {
    console.log('OrbitControls Structure Analysis:', {
      component: controlsComponent,
      keys: controlsComponent ? Object.keys(controlsComponent) : [],
      hasTarget: controlsComponent && 'target' in controlsComponent,
      hasValue: controlsComponent && 'value' in controlsComponent,
      hasEl: controlsComponent && '$el' in controlsComponent,
      hasExposed: controlsComponent && 'exposed' in controlsComponent,
      hasInstance: controlsComponent && 'instance' in controlsComponent,
      targetType: controlsComponent && controlsComponent.target ? typeof controlsComponent.target : 'undefined',
      valueType: controlsComponent && controlsComponent.value ? typeof controlsComponent.value : 'undefined'
    })
  }
}
