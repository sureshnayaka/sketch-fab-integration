
declare const Sketchfab: any;

// region : 3D Model details
/**
 * step 1 : you need to set the modelID from sketchfab
 * step2: set the materail name where you want to see the design on the model
 *  modelId: "37d7942bde4288a1e6e5bbbbce2fa23",
    materials: [
    {
        id: "0736156d-61af-40b8-a08f-c6cbfb09278e", //id (optional)
        name: 'PictureBorder.001', // mandatory 
        sourcePath: 'chili-pdf', // mandatory 
        useColor: false // mandatory 
    },
    {
        id: "e6fa3352-4f96-4ddf-9e08-4a17535ac89a",
        name: 'Frame.001',
        sourcePath: 'color',
        useColor: true
    },
    {
        id: "0220323w-4f96-4ddf-9e08-4a17535ac89a",
        name: 'PictureFrame.001',
        sourcePath: 'color',
        useColor: true
    }
]
 * 
 */
export const materialDetails = {
    modelId: "37d798042bde4288a1e6e5bbbbce2fa0",
    materials: [
        {
            name: 'PictureBorder.001', // mandatory 
            sourcePath: 'chili-pdf', // mandatory 
            useColor: false // mandatory 
        },
        {
            name: 'Frame.001',
            sourcePath: 'color',
            useColor: true
        },
        {
            name: 'PictureFrame.001',
            sourcePath: 'color',
            useColor: true
        }
    ]
};

//region: Viewer api initalization
export function _3DModule(imageURL: string, colors: [number, number, number]) {
    let client = new Sketchfab(document.getElementById('api-frame'));
    client.init(materialDetails.modelId, {
        success: function onSuccess(api: any) {
            api.start();
            api.addEventListener('viewerready', function () {
                console.log('Viewer is ready');
                api.getTextureList(function (err: any, textures: any) {
                    if (!err) {
                        console.log(textures);
                    }
                });
                console.log("View AR Popup Data.");
                const isPhotoFrameModel: any | null = materialDetails.materials;
                if (isPhotoFrameModel) {
                    isPhotoFrameModel.forEach((element: any) => {
                        if (element.useColor) {
                            let color: [number, number, number] = [0.0, 0.0, 0.0];
                            if (colors) {
                                color = colors
                            }
                            console.error(color)
                            applyColors(api, element.name, color);
                        }
                        else if (!element.useColor && element.sourcePath == 'chili-pdf') {
                            addAndApplyTexture(api, imageURL, element.name, self);
                        }
                        else if (!element.useColor && element.sourcePath == 'external-url') {
                            addAndApplyTexture(api, element.externalPath, element.name, self);
                        }

                    });

                }
                else {
                    addAndApplyTexture(api, imageURL, null, self);

                }
            });
        },
        error: function onError() {
            console.log('Viewer error');
        },
        ui_ar: 1
    });

}


export function addAndApplyTexture(api: any, textureUrl: any, materialName: string | null = null, self: any) {
    api.addTexture(textureUrl, function (err: any, textureUid: any) {
        if (!err) {
            api.getMaterialList(function (err: any, materials: any) {
                if (!err) {
                    materials.forEach(function (m: any) {
                        m.channels.AlbedoPBR.texture = {
                            uid: textureUid,
                            internalFormat: "RGB",
                            magFilter: "LINEAR",
                            minFilter: "LINEAR_MIPMAP_LINEAR",
                            texCoordUnit: 0,
                            textureTarget: "TEXTURE_2D",
                            wrapS: "REPEAT",
                            wrapT: "REPEAT",
                        };
                        if (materialName == null) {//for other model
                            api.setMaterial(m);
                        }
                        else if (materialName !== null && materialName == m.name) { //for photo frame model 
                            api.setMaterial(m);
                        }

                    });
                    console.log('New texture registered with UID', textureUid);
                    api.addEventListener('textureLoadProgress', function (factor: any) {
                        console.log('textureLoadProgress: ' + factor);
                    });
                }
            });
        }
    });

}


export function applyColors(api: any, materialName: string, color: [number, number, number]): void {
    api.getMaterialList((err: any, materials: any[]) => {
        if (err) {
            console.error('Error fetching materials:', err);
            return;
        }

        materials.forEach(material => {
            if (material.name === materialName) {
                setMaterialColor(api, material, color); // Green color
            }
        });
    });
}

export function setMaterialColor(api: any, material: any, color: [number, number, number]): void {
    material.channels.AlbedoPBR.color = color;
    material.channels.AlbedoPBR.useColor = true; // Ensure the color is used
    api.setMaterial(material);

    console.log(`Set color for ${material.name} to`, color);
}


