import * as Debug from 'debug';
import * as moment from 'moment-timezone';
import { i18n, TimeslotMatrix, PricingHelper, KeywordHelper } from '../../services';
import { createPayloadEvent, createResponse, Response } from '../bot.util';
import { Category, Product, Order, Asset, Booking, Store, Property, Unit, CONFIG_SERVICE } from '../../data';
import { BookingEvent, RLEvent } from '../business/constant';
import {
  FacebookItem, FacebookPayment, FacebookPayload, FacebookElement,
  FacebookAttachment, FacebookReceipt, FacebookButton, FacebookQuickReply, FacebookQuickReplies
} from './facebook.template';
import { AttachmentType, TemplateType, ButtonType, EventType, ContentType } from './facebook.constant';

let debug: Debug.IDebugger = Debug('facebook.attachment');


/** realestate templates */

export function unitsAttachment(units: Unit[]) {
  let elements = new Array<FacebookElement>();
  units.forEach((unit, index) => {
    let elm: FacebookElement = {
      title: unit.unitNum + ' (' + unit.numOfBedrooms + ' rooms on ' + unit.floorNum + ' flr) ',
      subtitle: '$' + unit.price + ' ' + unit.squareFeet + 'sf',
      image_url: unit.image.url(),
      buttons: [{
        type: ButtonType.web_url,
        title: 'Floor Plan',
        url: unit.floorPlan
        // payload: createPayloadEvent(RLEvent.SHOW_PROPERTY, { propertyId: property.id, keywords: [property.name] })
      }]
    };

    elements.push(elm);
  });

  return toListAttachment(elements, TemplateType.generic);
}

export function listingAttachment(properties: Property[]) {
  let elements = new Array<FacebookElement>();
  properties.forEach((property, index) => {
    let elm: FacebookElement = {
      title: property.name,
      subtitle: property.description,
      image_url: property.coverPhoto.url(),
      buttons: [{
        type: ButtonType.postback,
        title: 'Information',
        payload: createPayloadEvent(RLEvent.SHOW_PROPERTY, { propertyId: property.id, keywords: [property.name] })
      }]
    };

    elements.push(elm);
  });

  return toListAttachment(elements, TemplateType.generic);
}

export function propertyInfoAttachment(property: Property) {

  let info = property.name + ' property' + '\n' +
    'Located at: ' + property.address + ' ' + property.city + '\n' +
    'Compeletion date will be ' + property.completion + ' \n\n' +
    'More Infos here: ' + property.description;

  return createResponse(false, info);
}


/** booking templates */
export function mainMenuAttachment(store: Store): FacebookAttachment {

  const startBookingTitle = i18n.__('greeting_start_booking_title');
  const storeInfoTitle = i18n.__('greeting_store_info_title');
  const storeHoursTitle = i18n.__('greeting_store_hours_title');
  const browseServiceTittle = i18n.__('greeting_browse_services_title');

  const attachment: FacebookAttachment = {
    requireFeedback: true,
    content: {
      attachment: {
        type: AttachmentType.template,
        payload: {
          template_type: TemplateType.generic,
          elements: [{
            title: i18n.__('greeting_title', store.name),
            image_url: store.logo ? store.logo.url() : undefined,
            subtitle: i18n.__('greeting_subtitle'),
            buttons: [{
              type: ButtonType.postback,
              title: startBookingTitle,
              payload: createPayloadEvent(BookingEvent.ShowCategories, { keywords: [startBookingTitle] }),
            }, {
              type: ButtonType.phone_number,
              title: i18n.__('greeting_call_title'),
              payload: store.phone
            }, {
              type: ButtonType.element_share
            }]
          }, {
            title: store.name,
            image_url: store.image ? store.image.url() : undefined,
            subtitle: store.description,
            buttons: [{
              type: ButtonType.postback,
              title: storeInfoTitle,
              payload: createPayloadEvent(BookingEvent.ShowStoreInfo, { keywords: [storeInfoTitle] }),
            }, {
              type: ButtonType.postback,
              title: storeHoursTitle,
              payload: createPayloadEvent(BookingEvent.ShowStoreHours, { keywords: [storeHoursTitle] }),
            }, {
              type: ButtonType.postback,
              title: browseServiceTittle,
              payload: createPayloadEvent(BookingEvent.ShowCategories, { keywords: [browseServiceTittle] }),
            }]
          }]
        }
      }
    }
  };

  return attachment;
}

export function quickMenuAttachment(store: Store): FacebookQuickReplies {

  const startBookingTitle = i18n.__('greeting_start_booking_title');
  const storeInfoTitle = i18n.__('greeting_store_info_title');
  const storeHoursTitle = i18n.__('greeting_store_hours_title');

  const replies = [{
    content_type: ContentType.text,
    title: startBookingTitle,
    payload: createPayloadEvent(BookingEvent.ShowCategories, { keywords: [startBookingTitle] })
  }, {
    content_type: ContentType.text,
    title: storeInfoTitle,
    payload: createPayloadEvent(BookingEvent.ShowStoreInfo, { keywords: [storeInfoTitle] })
  }, {
    content_type: ContentType.text,
    title: storeHoursTitle,
    payload: createPayloadEvent(BookingEvent.ShowStoreHours, { keywords: [storeHoursTitle] })
  }];

  const quickReplies: FacebookQuickReplies = {
    requireFeedback: true,
    content: {
      text: i18n.__('suggest_next_message.' + store.messageConfig.MESSAGE_STYLE),
      quick_replies: replies
    }
  };

  return quickReplies;
}

export function storeHoursAttachment(store: Store): Response {

  // format store hours
  let hours = i18n.__('store_hours') + ':\n';
  if (!store.hours || store.hours.length < 1) {
    hours += i18n.__('n/a') + '\n';
  } else {
    let days = [
      i18n.__('sunday.short'),
      i18n.__('monday.short'),
      i18n.__('tuesday.short'),
      i18n.__('wednesday.short'),
      i18n.__('thursday.short'),
      i18n.__('friday.short'),
      i18n.__('saturday.short')
    ];
    store.hours.forEach((day, i) => {
      hours += days[i] + ':  ';
      if (!day.open || !day.close || day.open === day.close) {
        hours += i18n.__('closed') + '\n';
      } else {
        hours += day.open + '-' + day.close + '\n';
      }
    });
  }

  // format holiday hours
  let holidays = '\n' + i18n.__('store_hours_holidays') + ':\n';
  if (!store.hoursHolidays || store.hoursHolidays.length < 1) {
    holidays += i18n.__('n/a') + '\n';
  } else {
    store.hoursHolidays.forEach((day) => {
      holidays += day.day + ':  ';
      if (!day.open || !day.close || day.open === day.close) {
        holidays += i18n.__('closed') + '\n';
      } else {
        holidays += day.open + '-' + day.close + '\n';
      }
    });
    holidays += '\n';
  }

  return createResponse(false, hours + holidays);
}

export function storeHoursFinePrintAttachment(store: Store): Response {

  // store hours fine print
  let fineprint = i18n.__('store_hours_fine_print') + ':\n' + i18n.__(store.messageConfig.HOURS_FINE_PRINT);

  return createResponse(false, fineprint);
}

export function storeInfoAttachment(store: Store): Response {
  // format address
  let address = i18n.__('store_address') + ':\n';
  if (!store.address) {
    address += i18n.__('n/a') + '\n';
  } else {
    address += store.address.street_address ? (store.address.street_address + ',\n') : '';
    address += store.address.locality ? (store.address.locality + ', ') : '';
    address += store.address.region ? (store.address.region + ', ') : '';
    address += store.address.country ? (store.address.country + ' ') : '';
    address += store.address.postal_code ? store.address.postal_code : '';
    address += '\n';
  }

  // website
  let website = store.website ? (i18n.__('store_website') + ': ' + store.website + '\n') : '';
  // email
  let email = store.email ? (i18n.__('store_email') + ': ' + store.email + '\n') : '';
  // phone number
  let phone = store.phone ? (i18n.__('store_phone') + ': ' + store.phone + '\n') : '';
  // contact
  let contact = store.contact ? (i18n.__('store_contact') + ': ' + store.contact + '\n') : '';

  return createResponse(false, address + '\n' + website + email + phone + contact);
}

export function extraStoreInfoAttachment(store: Store): Response {
  // extra store info
  let extraInfo = store.messageConfig.EXTRA_STORE_INFO;
  return createResponse(false, extraInfo);
}

export function categoryListAttachment(categories: Category[]): any {

  let elements = new Array<FacebookElement>();

  categories.forEach((category, index) => {
    let elm: FacebookElement = {
      title: category.name + ' ' + PricingHelper.toTag(category.pricing),
      subtitle: category.description,
      image_url: category.image ? category.image.url() : undefined,
      buttons: [{
        type: ButtonType.postback,
        title: i18n.__('category_browse_title'),
        payload: createPayloadEvent(BookingEvent.ShowServices, { categoryId: category.id, keywords: [category.name] })
      }]
    };

    elements.push(elm);
  });

  return toListAttachment(elements, TemplateType.generic);
}

export function serviceListAttachment(services: Product[]): any {

  let elements = new Array<FacebookElement>();
  services.forEach((service, index) => {
    let elm: FacebookElement = {
      title: service.name + ' ' + PricingHelper.toTag(service.pricing, service.store.productConfig.CURRENCY),
      subtitle: service.description,
      image_url: service.image ? service.image.url() : undefined,
      buttons: [{
        type: ButtonType.postback,
        title: i18n.__('service_book_title'),
        payload: createPayloadEvent(BookingEvent.BookingPickedService, { serviceId: service.id, keywords: [service.name] })
      }]
    };

    elements.push(elm);
  });

  return toListAttachment(elements, TemplateType.generic);
}

export function assetListAttachment(store: Store, assets: Asset[], next2days: TimeslotMatrix[]): FacebookAttachment {
  let timeFormat = CONFIG_SERVICE.DISPLAY_CONFIG.TIME_SHORT_FORMAT;

  // debug('assetListAttachment prep', JSON.stringify(next2days));
  let elements = new Array<FacebookElement>();

  for (let i = 0; i < assets.length; i++) {
    let buttons = new Array<FacebookButton>();
    let asset = assets[i];

    let subtitle = '';
    for (let j = 0; j < next2days[i].matrix.length && j < 2; j++) {
      // loop through today and tomorrow (can only be today and tomorrow anyways, due to the number of buttons limitation)
      let summary: string;
      if (j === 0) {
        summary = i18n.__('today');
      } else if (j === 1) {
        summary = i18n.__('tomorrow');
      }

      let start = next2days[i].toMoment({
        x: j,
        y: 0
      }).start;
      if (next2days[i].isAnyGreater(start, 1440, 0)) {
        // add quick pick button
        // const button: FacebookButton = {
        //   type: ButtonType.postback,
        //   title: i18n.__('asset_choose_title', summary),
        //   payload: createPayloadEvent(
        //     BookingEvent.BookingPickedAssetDate,
        //     { assetId: asset.id, pickedDate: start.toISOString(), keywords: [] }
        //   )
        // };
        // buttons.push(button);

        // construct availibility summary
        let newStart = true;
        let availability = next2days[i].getRange(start, 1440);
        for (let k = 0; k < availability.length; k++) {
          if (newStart && availability[k] > 0) {
            summary += ' ' + next2days[i].toMoment({
              x: j,
              y: k
            }).start.format(timeFormat);
            newStart = false;
          }
          if (!newStart && availability[k + 1] <= 0) {
            summary += '~' + next2days[i].toMoment({
              x: j,
              y: k
            }).finish.format(timeFormat);
            newStart = true;
          }
        }
      } else {
        summary += ' ' + i18n.__('n/a');
      }
      subtitle += summary + '\n';
    }

    const bookButton: FacebookButton = {
      type: ButtonType.postback,
      title: buttons.length > 0 ? i18n.__('asset_choose_other_title') : i18n.__('asset_choose_title'),
      payload: createPayloadEvent(BookingEvent.BookingPickedAsset, { assetId: asset.id, keywords: [asset.name] })
    };
    buttons.push(bookButton);

    let elm: FacebookElement = {
      title: asset.name + ' - ' + asset.description,
      subtitle: subtitle,
      image_url: asset.image ? asset.image.url() : undefined,
      buttons: buttons
    };

    elements.push(elm);
  }

  return toListAttachment(elements, TemplateType.generic);
}

export function confirmationAttachment(booking: Booking, service: Product): FacebookAttachment {

  const timeslotConfig =
    service && service.timeslotConfig ||
    booking.store && booking.store.timeslotConfig ||
    CONFIG_SERVICE.TIMESLOT_CONFIG;
  const productConfig =
    booking.store && booking.store.productConfig ||
    CONFIG_SERVICE.PRODUCT_CONFIG;
  const displayConfig = CONFIG_SERVICE.DISPLAY_CONFIG;
  const timezone = timeslotConfig.TIMEZONE;
  const length = timeslotConfig.LENGTH;
  const currency = productConfig.CURRENCY;
  const taxrate = productConfig.TAX_RATE;
  const dateFormat = displayConfig.DATE_SHORT_FORMAT;
  const timeFormat = displayConfig.TIME_12HOUR_MIN_FORMAT;

  let start = moment.tz(booking.startTime, timezone);
  let end = start.clone().add(booking.totalDuration, 'minutes');

  let elements = Array<FacebookItem>();
  booking.items.forEach(item => {
    let quantity = item.quantity;
    let price = item.price * quantity;
    elements.push({
      title: i18n.__('booking_receipt_title', item.name, start.format(dateFormat), start.format(timeFormat), end.format(timeFormat)),
      subtitle: i18n.__('price_fine_print_message'),
      quantity: quantity,
      price: +price.toFixed(2),
      currency: i18n.__('currency.' + currency),
      image_url: item.imageUrl
    });
  });

  const totalRetial = booking.totalPrice;
  const totalTax = totalRetial * taxrate;
  const totalCost = totalRetial + totalTax;
  let receipt: FacebookReceipt = {
    template_type: AttachmentType.receipt,
    recipient_name: booking.user.firstName + ' ' + booking.user.lastName,
    merchant_name: booking.store.name,
    order_number: booking.id,
    currency: currency,
    payment_method: i18n.__('receipt_in_store'),
    timestamp: (booking.updatedAt.getTime() / 1000).toFixed(0),
    order_url: undefined,
    elements: elements,
    address: undefined,
    summary: {
      subtotal: +totalRetial.toFixed(2),
      total_tax: +totalTax.toFixed(2),
      total_cost: +totalCost.toFixed(2),
    },
    adjustments: []
  };

  let attachment: FacebookAttachment = {
    requireFeedback: false,
    content: {
      attachment: {
        type: AttachmentType.template,
        payload: receipt
      }
    }
  };
  return attachment;
}

export function dateQuickReplies(store: Store, availability: TimeslotMatrix, assetId: string, currentPageId: number): FacebookQuickReplies {

  const timeslotConfig =
    store && store.timeslotConfig ||
    CONFIG_SERVICE.TIMESLOT_CONFIG;

  let replies = new Array<FacebookQuickReply>();
  let previousPageReply: FacebookQuickReply;
  let nextPageReply: FacebookQuickReply;

  if (currentPageId > 0) {
    const perviousPageTitle = i18n.__('previous_page_dates_title');
    previousPageReply = {
      content_type: ContentType.text,
      title: perviousPageTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDates, {
        assetId: assetId,
        pageId: currentPageId - 1,
        keywords: [perviousPageTitle]
      })
    };
    replies.push(previousPageReply);
  }

  for (let i = 0; i < availability.matrix.length; i++) {
    let date = availability.toMoment({
      x: i,
      y: 0
    }).start;

    if (availability.isAnyGreater(date, 1440, 0)) {
      const reply: FacebookQuickReply = {
        content_type: 'text',
        title: date.format(CONFIG_SERVICE.DISPLAY_CONFIG.DATE_FORMAT),
        payload: createPayloadEvent(BookingEvent.BookingPickedAssetDate, {
          assetId: assetId,
          pickedDate: date.toISOString(),
          keywords: KeywordHelper.toDateKeywords(date.toDate(), timeslotConfig.TIMEZONE)
        })
      };
      replies.push(reply);
    }
  }

  const nextPageTitle = i18n.__('next_page_dates_title');
  nextPageReply = {
    content_type: ContentType.text,
    title: nextPageTitle,
    payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDates, {
      assetId: assetId,
      pageId: currentPageId + 1,
      keywords: [nextPageTitle]
    })
  };

  replies.push(nextPageReply);

  let quickReplies: FacebookQuickReplies = {
    requireFeedback: true,
    content: {
      text: i18n.__('show_date_message.' + store.messageConfig.MESSAGE_STYLE),
      quick_replies: replies
    }
  };

  return quickReplies;
}

export function timeQuickReplies(
  store: Store,
  booking: Booking,
  availability: TimeslotMatrix,
  assetId: string,
  currentPageId: number): FacebookQuickReplies {

  const timeslotConfig = store.timeslotConfig;
  const length = booking && booking.totalDuration || timeslotConfig.LENGTH;
  const productConfig = store.productConfig;
  const displayConfig = CONFIG_SERVICE.DISPLAY_CONFIG;
  const timezone = timeslotConfig.TIMEZONE;
  const numberOfTimeSlots = displayConfig.NUMBER_OF_TIMESLOTS;
  const timeFormat = displayConfig.TIME_12HOUR_MIN_FORMAT;

  let replies = new Array<FacebookQuickReply>();
  let previousPageReply: FacebookQuickReply;
  let showNextPageReply: boolean = false;
  let nextPageReply: FacebookQuickReply;
  let showDatesReply: FacebookQuickReply;

  if (currentPageId > 0) {
    const perviousPageTitle = i18n.__('previous_page_times_title');
    previousPageReply = {
      content_type: ContentType.text,
      title: perviousPageTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssetAvailableTimes, {
        assetId: assetId,
        pickedDate: availability.origin.toISOString(),
        pageId: currentPageId - 1,
        keywords: [perviousPageTitle]
      })
    };

    replies.push(previousPageReply);
  }

  let slots = availability.getRange(availability.origin, 1440);
  let count = 0;
  for (let i = 0; i < slots.length; i++) {
    let time = availability.toMoment({
      x: 0,
      y: i
    }).start;
    if (availability.isAllGreater(time, length, 0)) {
      count++;
      if (count > currentPageId * numberOfTimeSlots && count <= (currentPageId + 1) * numberOfTimeSlots) {
        const reply: FacebookQuickReply = {
          content_type: 'text',
          title: time.format(timeFormat),
          payload: createPayloadEvent(BookingEvent.BookingPickedAssetTime, {
            assetId: assetId,
            pickedTime: time.toISOString(),
            keywords: KeywordHelper.toTimeKeywords(time.toDate(), timezone)
          })
        };
        replies.push(reply);
      }
      if (count > (currentPageId + 1) * numberOfTimeSlots) {
        showNextPageReply = true;
        break;
      }
    }
  }

  if (showNextPageReply) {
    const nextPageTitle = i18n.__('next_page_times_title');
    nextPageReply = {
      content_type: ContentType.text,
      title: nextPageTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssetAvailableTimes, {
        assetId: assetId,
        pickedDate: availability.origin.toISOString(),
        pageId: currentPageId + 1,
        keywords: [nextPageTitle]
      })
    };

    replies.push(nextPageReply);
  }

  const repickDateTitle = i18n.__('repick_date_title');
  showDatesReply = {
    content_type: ContentType.text,
    title: repickDateTitle,
    payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDates, {
      assetId: assetId,
      keywords: [repickDateTitle]
    })
  };
  replies.push(showDatesReply);

  let quickReplies: FacebookQuickReplies = {
    requireFeedback: true,
    content: {
      text: i18n.__('show_time_message.' + store.messageConfig.MESSAGE_STYLE),
      quick_replies: replies
    }
  };

  return quickReplies;
}

export function durationQuickReplies(
  store: Store,
  product: Product,
  pickedStartTime: string,
  availability: TimeslotMatrix,
  assetId: string,
  currentPageId: number): FacebookQuickReplies {

  const timeslotConfig = product && product.timeslotConfig || store.timeslotConfig;
  const displayConfig = CONFIG_SERVICE.DISPLAY_CONFIG;
  const timezone = timeslotConfig.TIMEZONE;
  const length = timeslotConfig.LENGTH;
  const numberOfDurations = displayConfig.NUMBER_OF_DURATIONS;
  const timeFormat = displayConfig.TIME_12HOUR_MIN_FORMAT;

  let replies = new Array<FacebookQuickReply>();
  let previousPageReply: FacebookQuickReply;
  let showNextPageReply: boolean = false;
  let nextPageReply: FacebookQuickReply;
  let showDatesReply: FacebookQuickReply;

  if (currentPageId > 0) {
    const perviousPageTitle = i18n.__('previous_page_duration_title');
    previousPageReply = {
      content_type: 'text',
      title: perviousPageTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDurations, {
        assetId: assetId,
        serviceId: product.id,
        pickedStartTime: pickedStartTime,
        pageId: currentPageId - 1,
        keywords: [perviousPageTitle]
      })
    };
    replies.push(previousPageReply);
  }

  // calculate the longest duration
  let start = moment.tz(pickedStartTime, timezone);
  for (let count = 1; availability.isAllGreater(start, length * count, 0); count++) {
    if ((currentPageId * numberOfDurations) < count && count <= ((currentPageId + 1) * numberOfDurations)) {
      const duration = length * count;
      const hour = Math.floor(duration / 60);
      const minute = duration % 60;
      const title = (hour > 0 ? i18n.__n(<any>'%s hr', hour) + ' ' : '') + (minute > 0 ? i18n.__n(<any>'%s min', minute) + ' ' : '');
      const reply: FacebookQuickReply = {
        content_type: ContentType.text,
        title: title,
        payload: createPayloadEvent(BookingEvent.BookingPickedDuration, {
          assetId: assetId,
          serviceId: product.id,
          duration: duration,
          quantity: count,
          pickedStartTime: pickedStartTime,
          keywords: [title]
        })
      };
      replies.push(reply);
    }
    if (count > (currentPageId + 1) * numberOfDurations) {
      showNextPageReply = true;
      break;
    }
  }

  if (showNextPageReply) {
    const nextPageTitle = i18n.__('next_page_duration_title');
    nextPageReply = {
      content_type: 'text',
      title: nextPageTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDurations, {
        assetId: assetId,
        serviceId: product.id,
        pickedStartTime: pickedStartTime,
        pageId: currentPageId + 1,
        keywords: [nextPageTitle]
      })
    };
    replies.push(nextPageReply);
  }

  const repickDateTitle = i18n.__('repick_time_title');
  showDatesReply = {
    content_type: 'text',
    title: repickDateTitle,
    payload: createPayloadEvent(BookingEvent.ShowAssetAvailableTimes, {
      assetId: assetId,
      pickedDate: pickedStartTime,
      keywords: [repickDateTitle]
    })
  };
  replies.push(showDatesReply);

  const quickReplies: FacebookQuickReplies = {
    requireFeedback: true,
    content: {
      text: i18n.__('show_duration_message.' + store.messageConfig.MESSAGE_STYLE),
      quick_replies: replies
    }
  };
  return quickReplies;
}

export function confirmationQuickReplies(booking: Booking): FacebookQuickReplies {
  const confirmBookingTitle = i18n.__('booking_confirm_title');
  const rejectBookingTitle = i18n.__('booking_reject_title');

  const replies = [{
    content_type: ContentType.text,
    title: confirmBookingTitle,
    payload: createPayloadEvent(BookingEvent.BookingConfirmed, { bookingId: booking.id, keywords: [confirmBookingTitle] })
  }, {
    content_type: ContentType.text,
    title: rejectBookingTitle,
    payload: createPayloadEvent(BookingEvent.BookingCancelled, { bookingId: booking.id, keywords: [rejectBookingTitle] })
  }];

  const quickReplies: FacebookQuickReplies = {
    requireFeedback: true,
    content: {
      text: i18n.__('booking_confirm_message.' + booking.store.messageConfig.MESSAGE_STYLE),
      quick_replies: replies
    }
  };

  return quickReplies;
}

export function bookingStateQuickReplies(store: Store, booking: Booking): FacebookQuickReplies {

  const timezone = store.timeslotConfig.TIMEZONE;
  const assetAlias = store.messageConfig.ASSET_ALIAS;
  const currency = store.productConfig.CURRENCY;
  const dateFormat = CONFIG_SERVICE.DISPLAY_CONFIG.DATE_FORMAT;
  const timeFormat = CONFIG_SERVICE.DISPLAY_CONFIG.TIME_12HOUR_MIN_FORMAT;

  let quickReplies: FacebookQuickReplies;
  let buttons = new Array<FacebookQuickReply>();
  let gotAllInfo = false;
  let summary = '';

  const changeServiceTitle = i18n.__('booking_change_service_title');
  const addServiceTitle = i18n.__('booking_choose_service_title');
  const changeAssetTitle = i18n.__('booking_change_asset_title', { asset: assetAlias });
  const addAssetTitle = i18n.__('booking_choose_asset_title', { asset: assetAlias });
  const changeDateTitle = i18n.__('booking_change_date_title');
  const addDateTitle = i18n.__('booking_choose_date_title');
  const changeStartTimeTitle = i18n.__('booking_change_time_title');
  const addStartTimeTitle = i18n.__('booking_choose_time_title');
  const confirmBookingTitle = i18n.__('booking_final_confirm_title');
  const rejectBookingTitle = i18n.__('booking_cancel_title');

  /** booking service */
  if (booking.items && booking.items.length > 0) {
    let serviceSummary = '';
    booking.items.forEach(item => {
      serviceSummary += item.name + ' ' + item.price;
      serviceSummary += ' ';
    });
    summary += i18n.__('booking_service_summary_message', serviceSummary);
    buttons.push({
      content_type: ContentType.text,
      title: changeServiceTitle,
      payload: createPayloadEvent(BookingEvent.ShowCategories, { keywords: [changeServiceTitle] })
    });
  } else {
    buttons.push({
      content_type: ContentType.text,
      title: addServiceTitle,
      payload: createPayloadEvent(BookingEvent.ShowCategories, { keywords: [addServiceTitle] })
    });
  }

  /** booking asset */
  if (booking.asset) {
    summary += i18n.__('booking_asset_summary_message', { asset: assetAlias, name: booking.asset.name });
    buttons.push({
      content_type: ContentType.text,
      title: changeAssetTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssets, { keywords: [changeAssetTitle] })
    });

    /** booking date, start time & duration*/
    if (booking.date) {
      let bookingDate = moment.tz(booking.date, timezone);
      summary += i18n.__('booking_date_summary_message', bookingDate.format(dateFormat));
      buttons.push({
        content_type: ContentType.text,
        title: changeDateTitle,
        payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDates, {
          assetId: booking.asset ? booking.asset.id : null,
          keywords: [changeDateTitle]
        })
      });

      /** booking time and duration */
      if (booking.startTime && booking.totalDuration) {
        let startTime = moment.tz(booking.startTime, timezone);
        let endTime = startTime.clone().add(booking.totalDuration, 'minutes').format(timeFormat);
        summary += i18n.__('booking_time_summary_message', startTime.format(timeFormat), endTime);
        buttons.push({
          content_type: ContentType.text,
          title: changeStartTimeTitle,
          payload: createPayloadEvent(BookingEvent.ShowAssetAvailableTimes, {
            assetId: booking.asset.id,
            pickedDate: booking.date,
            keywords: [changeStartTimeTitle]
          })
        });

        /** get all information from user */
        gotAllInfo = true;

      } else {
        buttons.push({
          content_type: ContentType.text,
          title: addStartTimeTitle,
          payload: createPayloadEvent(BookingEvent.ShowAssetAvailableTimes, {
            assetId: booking.asset.id,
            pickedDate: booking.date,
            keywords: [addStartTimeTitle]
          })
        });
      }

    } else {
      buttons.push({
        content_type: ContentType.text,
        title: addDateTitle,
        payload: createPayloadEvent(BookingEvent.ShowAssetAvailableDates, {
          assetId: booking.asset ? booking.asset.id : null,
          keywords: [addDateTitle]
        })
      });
    }
  } else {
    buttons.push({
      content_type: ContentType.text,
      title: addAssetTitle,
      payload: createPayloadEvent(BookingEvent.ShowAssets, { keywords: [addAssetTitle] })
    });
  }

  /** confirm booking */
  if (gotAllInfo) {
    buttons.push({
      content_type: ContentType.text,
      title: confirmBookingTitle,
      payload: createPayloadEvent(BookingEvent.BookingConfirmed, {
        bookingId: booking.id,
        keywords: [confirmBookingTitle]
      })
    });
  }

  /** cancel booking */
  if (buttons.length > 0) {
    buttons.push({
      content_type: ContentType.text,
      title: rejectBookingTitle,
      payload: createPayloadEvent(BookingEvent.BookingCancelled, {
        bookingId: booking.id,
        keywords: [rejectBookingTitle]
      })
    });
  }

  quickReplies = {
    requireFeedback: true,
    content: {
      text: summary,
      quick_replies: buttons
    }
  };

  return quickReplies;
}

function toListAttachment(elements: FacebookElement[], templateType: string): FacebookAttachment {

  let attachment: FacebookAttachment = {
    requireFeedback: true,
    content: {
      attachment: {
        type: 'template',
        payload: {
          template_type: templateType,
          elements: elements
        }
      }
    }
  };

  return attachment;
}
