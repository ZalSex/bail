"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadingNecessaryImages = exports.toProductNode = exports.parseProductNode = exports.parseOrderDetailsNode = exports.parseCollectionsNode = exports.parseCatalogNode = void 0;
exports.uploadingNecessaryImagesOfProduct = uploadingNecessaryImagesOfProduct;
var _boom = require("@hapi/boom");
var _crypto = require("crypto");
var _fs = require("fs");
var _os = require("os");
var _path = require("path");
var _index = require("../WABinary/index.js");
var _generics = require("./generics.js");
var _messagesMedia = require("./messages-media.js");
const parseCatalogNode = node => {
  const catalogNode = (0, _index.getBinaryNodeChild)(node, 'product_catalog');
  const products = (0, _index.getBinaryNodeChildren)(catalogNode, 'product').map(parseProductNode);
  const paging = (0, _index.getBinaryNodeChild)(catalogNode, 'paging');
  return {
    products,
    nextPageCursor: paging ? (0, _index.getBinaryNodeChildString)(paging, 'after') : undefined
  };
};
exports.parseCatalogNode = parseCatalogNode;
const parseCollectionsNode = node => {
  const collectionsNode = (0, _index.getBinaryNodeChild)(node, 'collections');
  const collections = (0, _index.getBinaryNodeChildren)(collectionsNode, 'collection').map(collectionNode => {
    const id = (0, _index.getBinaryNodeChildString)(collectionNode, 'id');
    const name = (0, _index.getBinaryNodeChildString)(collectionNode, 'name');
    const products = (0, _index.getBinaryNodeChildren)(collectionNode, 'product').map(parseProductNode);
    return {
      id,
      name,
      products,
      status: parseStatusInfo(collectionNode)
    };
  });
  return {
    collections
  };
};
exports.parseCollectionsNode = parseCollectionsNode;
const parseOrderDetailsNode = node => {
  const orderNode = (0, _index.getBinaryNodeChild)(node, 'order');
  const products = (0, _index.getBinaryNodeChildren)(orderNode, 'product').map(productNode => {
    const imageNode = (0, _index.getBinaryNodeChild)(productNode, 'image');
    return {
      id: (0, _index.getBinaryNodeChildString)(productNode, 'id'),
      name: (0, _index.getBinaryNodeChildString)(productNode, 'name'),
      imageUrl: (0, _index.getBinaryNodeChildString)(imageNode, 'url'),
      price: +(0, _index.getBinaryNodeChildString)(productNode, 'price'),
      currency: (0, _index.getBinaryNodeChildString)(productNode, 'currency'),
      quantity: +(0, _index.getBinaryNodeChildString)(productNode, 'quantity')
    };
  });
  const priceNode = (0, _index.getBinaryNodeChild)(orderNode, 'price');
  const orderDetails = {
    price: {
      total: +(0, _index.getBinaryNodeChildString)(priceNode, 'total'),
      currency: (0, _index.getBinaryNodeChildString)(priceNode, 'currency')
    },
    products
  };
  return orderDetails;
};
exports.parseOrderDetailsNode = parseOrderDetailsNode;
const toProductNode = (productId, product) => {
  const attrs = {};
  const content = [];
  if (typeof productId !== 'undefined') {
    content.push({
      tag: 'id',
      attrs: {},
      content: Buffer.from(productId)
    });
  }
  if (typeof product.name !== 'undefined') {
    content.push({
      tag: 'name',
      attrs: {},
      content: Buffer.from(product.name)
    });
  }
  if (typeof product.description !== 'undefined') {
    content.push({
      tag: 'description',
      attrs: {},
      content: Buffer.from(product.description)
    });
  }
  if (typeof product.retailerId !== 'undefined') {
    content.push({
      tag: 'retailer_id',
      attrs: {},
      content: Buffer.from(product.retailerId)
    });
  }
  if (product.images.length) {
    content.push({
      tag: 'media',
      attrs: {},
      content: product.images.map(img => {
        if (!('url' in img)) {
          throw new _boom.Boom('Expected img for product to already be uploaded', {
            statusCode: 400
          });
        }
        return {
          tag: 'image',
          attrs: {},
          content: [{
            tag: 'url',
            attrs: {},
            content: Buffer.from(img.url.toString())
          }]
        };
      })
    });
  }
  if (typeof product.price !== 'undefined') {
    content.push({
      tag: 'price',
      attrs: {},
      content: Buffer.from(product.price.toString())
    });
  }
  if (typeof product.currency !== 'undefined') {
    content.push({
      tag: 'currency',
      attrs: {},
      content: Buffer.from(product.currency)
    });
  }
  if ('originCountryCode' in product) {
    if (typeof product.originCountryCode === 'undefined') {
      attrs['compliance_category'] = 'COUNTRY_ORIGIN_EXEMPT';
    } else {
      content.push({
        tag: 'compliance_info',
        attrs: {},
        content: [{
          tag: 'country_code_origin',
          attrs: {},
          content: Buffer.from(product.originCountryCode)
        }]
      });
    }
  }
  if (typeof product.isHidden !== 'undefined') {
    attrs['is_hidden'] = product.isHidden.toString();
  }
  const node = {
    tag: 'product',
    attrs,
    content
  };
  return node;
};
exports.toProductNode = toProductNode;
const parseProductNode = productNode => {
  const isHidden = productNode.attrs.is_hidden === 'true';
  const id = (0, _index.getBinaryNodeChildString)(productNode, 'id');
  const mediaNode = (0, _index.getBinaryNodeChild)(productNode, 'media');
  const statusInfoNode = (0, _index.getBinaryNodeChild)(productNode, 'status_info');
  const product = {
    id,
    imageUrls: parseImageUrls(mediaNode),
    reviewStatus: {
      whatsapp: (0, _index.getBinaryNodeChildString)(statusInfoNode, 'status')
    },
    availability: 'in stock',
    name: (0, _index.getBinaryNodeChildString)(productNode, 'name'),
    retailerId: (0, _index.getBinaryNodeChildString)(productNode, 'retailer_id'),
    url: (0, _index.getBinaryNodeChildString)(productNode, 'url'),
    description: (0, _index.getBinaryNodeChildString)(productNode, 'description'),
    price: +(0, _index.getBinaryNodeChildString)(productNode, 'price'),
    currency: (0, _index.getBinaryNodeChildString)(productNode, 'currency'),
    isHidden
  };
  return product;
};
/**
 * Uploads images not already uploaded to WA's servers
 */
exports.parseProductNode = parseProductNode;
async function uploadingNecessaryImagesOfProduct(product, waUploadToServer, timeoutMs = 30000) {
  product = {
    ...product,
    images: product.images ? await uploadingNecessaryImages(product.images, waUploadToServer, timeoutMs) : product.images
  };
  return product;
}
/**
 * Uploads images not already uploaded to WA's servers
 */
const uploadingNecessaryImages = async (images, waUploadToServer, timeoutMs = 30000) => {
  const results = await Promise.all(images.map(async img => {
    if ('url' in img) {
      const url = img.url.toString();
      if (url.includes('.whatsapp.net')) {
        return {
          url
        };
      }
    }
    const {
      stream
    } = await (0, _messagesMedia.getStream)(img);
    const hasher = (0, _crypto.createHash)('sha256');
    const filePath = (0, _path.join)((0, _os.tmpdir)(), 'img' + (0, _generics.generateMessageIDV2)());
    const encFileWriteStream = (0, _fs.createWriteStream)(filePath);
    for await (const block of stream) {
      hasher.update(block);
      encFileWriteStream.write(block);
    }
    const sha = hasher.digest('base64');
    const {
      directPath
    } = await waUploadToServer(filePath, {
      mediaType: 'product-catalog-image',
      fileEncSha256B64: sha,
      timeoutMs
    });
    await _fs.promises.unlink(filePath).catch(err => console.log('Error deleting temp file ', err));
    return {
      url: (0, _messagesMedia.getUrlFromDirectPath)(directPath)
    };
  }));
  return results;
};
exports.uploadingNecessaryImages = uploadingNecessaryImages;
const parseImageUrls = mediaNode => {
  const imgNode = (0, _index.getBinaryNodeChild)(mediaNode, 'image');
  return {
    requested: (0, _index.getBinaryNodeChildString)(imgNode, 'request_image_url'),
    original: (0, _index.getBinaryNodeChildString)(imgNode, 'original_image_url')
  };
};
const parseStatusInfo = mediaNode => {
  const node = (0, _index.getBinaryNodeChild)(mediaNode, 'status_info');
  return {
    status: (0, _index.getBinaryNodeChildString)(node, 'status'),
    canAppeal: (0, _index.getBinaryNodeChildString)(node, 'can_appeal') === 'true'
  };
};
//# sourceMappingURL=business.js.map